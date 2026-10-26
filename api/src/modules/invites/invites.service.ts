import {
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import type { ClientContext } from "../../common/auth/client-context.js";
import { PaginatedResult } from "../../common/http/api-response.js";
import { pageWindow } from "../../common/http/pagination-query.dto.js";
import { normalizeEmail } from "../../common/utils/normalize-email.js";
import { webappLink } from "../../common/utils/webapp-link.js";
import type { Institution, Invite, Prisma } from "../../generated/prisma/client.js";
import type { InstitutionRole } from "../../generated/prisma/enums.js";
import { isUniqueConstraintError } from "../../lib/database/prisma-errors.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService, type EmailDeliveryStatus } from "../../lib/mail/mail.service.js";
import { AuthService } from "../auth/auth.service.js";
import type { AuthSessionResult } from "../auth/auth.types.js";
import { PasswordService } from "../auth/password.service.js";
import { TokenService } from "../auth/token.service.js";
import { InstitutionAccessService } from "../institutions/institution-access.service.js";
import type {
  AcceptInviteDto,
  InviteListQueryDto,
  IssueInviteDto,
} from "./dto/invite-request.dto.js";
import type {
  InviteJoinedView,
  InviteLookupView,
  InviteView,
  IssuedInviteView,
} from "./invites.types.js";

const withInviter = {
  invitedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.InviteInclude;

type InviteWithInviter = Prisma.InviteGetPayload<{ include: typeof withInviter }>;
type UsableInvite = Invite & { institution: Institution | null };

/**
 * An invitation into an institution. The Invite_one_target check gives every
 * invitation either an institution and a role, or the content team's platform
 * role, so one with an institution always has its role.
 */
type InstitutionInvite = Invite & {
  institutionId: string;
  role: InstitutionRole;
  institution: Institution;
};

function isInstitutionInvite(invite: UsableInvite): invite is InstitutionInvite {
  return invite.institution !== null && invite.role !== null;
}

/** The role an institution invitation carries, which the check guarantees. */
function institutionRoleOf(invite: { role: InstitutionRole | null }): InstitutionRole {
  if (!invite.role) {
    throw new Error("An institution invitation without a role: Invite_one_target was bypassed");
  }

  return invite.role;
}

/** Who to ask about an invitation that can no longer be used. */
function whoToAsk(invite: UsableInvite): string {
  return invite.institution ? "your institution" : "whoever invited you";
}

const inviteNotFound = () =>
  new NotFoundException({ code: "INVITE_NOT_FOUND", message: "Invitation not found." });

const alreadyAccepted = () =>
  new ConflictException({
    code: "INVITE_ALREADY_ACCEPTED",
    message: "This invitation has already been accepted. Sign in to continue.",
  });

const institutionUnavailable = () =>
  new ConflictException({
    code: "INSTITUTION_UNAVAILABLE",
    message: "This institution is not accepting new members.",
  });

const accountExists = () =>
  new ConflictException({
    code: "ACCOUNT_EXISTS",
    message: "An account already uses this email. Sign in, then accept the invitation.",
  });

/**
 * Institution-led onboarding: an institution admin — or a platform admin —
 * invites someone by email, and the invitee accepts with the link.
 *
 * The raw token exists only in the email. The database holds its hash, and no
 * response ever carries it: returning it would let whoever issued an invite
 * accept it themselves and set the invitee's password.
 */
@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly access: InstitutionAccessService,
    private readonly tokens: TokenService,
    private readonly passwords: PasswordService,
    private readonly auth: AuthService,
    private readonly mail: MailService,
  ) {}

  async issue(
    user: AuthenticatedUser,
    institutionId: string,
    input: IssueInviteDto,
  ): Promise<IssuedInviteView> {
    const { institution } = await this.access.assertCanManage(user, institutionId);

    if (institution.status !== "ACTIVE") {
      throw institutionUnavailable();
    }

    const email = normalizeEmail(input.email);

    const existingMember = await this.prisma.membership.findFirst({
      where: { institutionId, status: "ACTIVE", user: { email } },
      select: { id: true },
    });

    if (existingMember) {
      throw new ConflictException({
        code: "ALREADY_MEMBER",
        message: "This person is already a member of the institution.",
      });
    }

    const token = this.tokens.generateOpaqueToken();
    const now = new Date();

    const invite = await this.prisma.$transaction(async (tx) => {
      // At most one live invite per person per institution: the newest wins.
      await tx.invite.updateMany({
        where: { institutionId, email, status: "PENDING" },
        data: { status: "REVOKED", revokedAt: now },
      });

      const created = await tx.invite.create({
        data: {
          institutionId,
          email,
          role: input.role,
          tokenHash: this.tokens.hashToken(token),
          expiresAt: this.inviteExpiry(now),
          invitedById: user.userId,
        },
        include: withInviter,
      });

      await tx.auditEvent.create({
        data: {
          institutionId,
          actorUserId: user.userId,
          action: "invite.issued",
          entityType: "Invite",
          entityId: created.id,
          metadata: { email, role: input.role },
        },
      });

      return created;
    });

    return {
      ...toInviteView(invite),
      emailStatus: await this.sendInvite(invite, institution, token),
    };
  }

  async list(
    user: AuthenticatedUser,
    institutionId: string,
    query: InviteListQueryDto,
  ): Promise<PaginatedResult<InviteView>> {
    await this.access.assertCanManage(user, institutionId);

    const now = new Date();
    const where: Prisma.InviteWhereInput = { institutionId, ...statusFilter(query.status, now) };

    const [invites, total] = await this.prisma.$transaction([
      this.prisma.invite.findMany({
        where,
        include: withInviter,
        orderBy: { createdAt: "desc" },
        ...pageWindow(query),
      }),
      this.prisma.invite.count({ where }),
    ]);

    return PaginatedResult.of(
      invites.map((invite) => toInviteView(invite, now)),
      total,
      query.page,
      query.pageSize,
    );
  }

  /** A fresh token and expiry, for an invite that was lost or lapsed. */
  async resend(
    user: AuthenticatedUser,
    institutionId: string,
    inviteId: string,
  ): Promise<IssuedInviteView> {
    const { institution } = await this.access.assertCanManage(user, institutionId);

    if (institution.status !== "ACTIVE") {
      throw institutionUnavailable();
    }

    const invite = await this.findInInstitution(institutionId, inviteId);

    if (invite.status === "ACCEPTED" || invite.status === "REVOKED") {
      throw new ConflictException({
        code: "INVITE_NOT_PENDING",
        message: "Only a pending or expired invitation can be resent.",
      });
    }

    const token = this.tokens.generateOpaqueToken();
    const now = new Date();

    const reissued = await this.prisma.$transaction(async (tx) => {
      // The new token hash replaces the old one, so the old link stops working.
      const updated = await tx.invite.update({
        where: { id: invite.id },
        data: {
          tokenHash: this.tokens.hashToken(token),
          expiresAt: this.inviteExpiry(now),
          status: "PENDING",
        },
        include: withInviter,
      });

      await this.audit(tx, user, institutionId, invite.id, "invite.resent");

      return updated;
    });

    return {
      ...toInviteView(reissued),
      emailStatus: await this.sendInvite(reissued, institution, token),
    };
  }

  async revoke(
    user: AuthenticatedUser,
    institutionId: string,
    inviteId: string,
  ): Promise<InviteView> {
    await this.access.assertCanManage(user, institutionId);

    const invite = await this.findInInstitution(institutionId, inviteId);

    if (invite.status === "ACCEPTED") {
      throw new ConflictException({
        code: "INVITE_ALREADY_ACCEPTED",
        message: "This invitation has already been accepted. Suspend the membership instead.",
      });
    }

    // Revoking is idempotent.
    if (invite.status === "REVOKED") {
      return toInviteView(invite);
    }

    const revoked = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.invite.update({
        where: { id: invite.id },
        data: { status: "REVOKED", revokedAt: new Date() },
        include: withInviter,
      });

      await this.audit(tx, user, institutionId, invite.id, "invite.revoked");

      return updated;
    });

    return toInviteView(revoked);
  }

  /** What the accept page shows before the invitee commits to anything. */
  async lookup(token: string): Promise<InviteLookupView> {
    const invite = await this.loadUsable(token);
    const account = await this.prisma.user.findUnique({
      where: { email: invite.email },
      select: { id: true },
    });

    return {
      email: invite.email,
      kind: isInstitutionInvite(invite) ? "INSTITUTION" : "CONTENT_TEAM",
      role: invite.role,
      expiresAt: invite.expiresAt,
      accountExists: account !== null,
      institution: invite.institution
        ? { id: invite.institution.id, name: invite.institution.name }
        : null,
    };
  }

  /**
   * Accepts an invite for someone with no account yet: creates the account,
   * already email-verified — following the link proves the address — and signs
   * them in, to the institution that invited them or, for the content team,
   * to no institution at all.
   */
  async accept(input: AcceptInviteDto, client: ClientContext): Promise<AuthSessionResult> {
    const invite = await this.loadUsable(input.token);

    if (await this.prisma.user.findUnique({ where: { email: invite.email }, select: { id: true } })) {
      throw accountExists();
    }

    const passwordHash = await this.passwords.hash(input.password);
    const now = new Date();
    let userId: string;

    try {
      userId = await this.prisma.$transaction(async (tx) => {
        await this.consume(tx, invite, now);

        const account = await tx.user.create({
          data: {
            email: invite.email,
            firstName: input.firstName,
            lastName: input.lastName,
            passwordHash,
            emailVerifiedAt: now,
            ...(invite.platformRole ? { platformRole: invite.platformRole } : {}),
          },
        });

        if (isInstitutionInvite(invite)) {
          await this.grantMembership(tx, account.id, invite, now);
        }

        await tx.invite.update({ where: { id: invite.id }, data: { acceptedById: account.id } });
        await this.recordAcceptance(tx, account.id, invite);

        return account.id;
      });
    } catch (error) {
      // Another sign-up claimed the email between our check and our write.
      if (isUniqueConstraintError(error)) {
        throw accountExists();
      }

      throw error;
    }

    return this.auth.startSession(userId, invite.institutionId, client);
  }

  /**
   * Accepts an invite for someone who already has an account and is signed in:
   * a membership for an institution invitation, or the content-team role on
   * top of whatever the account already belongs to.
   */
  async join(user: AuthenticatedUser, token: string): Promise<InviteJoinedView> {
    const invite = await this.loadUsable(token);

    const account = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { email: true, deactivatedAt: true, platformRole: true },
    });

    if (!account || account.deactivatedAt) {
      throw new UnauthorizedException({
        code: "ACCOUNT_DEACTIVATED",
        message: "This account has been deactivated.",
      });
    }

    // Someone else's invite: never confirm that it exists.
    if (account.email !== invite.email) {
      throw inviteNotFound();
    }

    if (!isInstitutionInvite(invite)) {
      return this.joinContentTeam(user, invite, account.platformRole);
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_institutionId: { userId: user.userId, institutionId: invite.institutionId } },
      select: { status: true },
    });

    if (membership?.status === "ACTIVE") {
      throw new ConflictException({
        code: "ALREADY_MEMBER",
        message: "You are already a member of this institution.",
      });
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await this.consume(tx, invite, now);
      await this.grantMembership(tx, user.userId, invite, now);
      await tx.invite.update({ where: { id: invite.id }, data: { acceptedById: user.userId } });
      await this.recordAcceptance(tx, user.userId, invite);
    });

    return {
      kind: "INSTITUTION",
      membership: {
        institutionId: invite.institutionId,
        institutionName: invite.institution.name,
        institutionSlug: invite.institution.slug,
        role: invite.role,
        independentLearners: invite.institution.kind === "INDEPENDENT_LEARNERS",
      },
    };
  }

  /**
   * The content team, for an account that is not on it yet. Someone already on
   * it is refused: a content manager has nothing to gain, and a platform
   * administrator must never be turned into one.
   */
  private async joinContentTeam(
    user: AuthenticatedUser,
    invite: UsableInvite,
    current: string,
  ): Promise<InviteJoinedView> {
    if (current !== "NONE") {
      throw new ConflictException({
        code: "ALREADY_CONTENT_TEAM",
        message: "You are already on the content team.",
      });
    }

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await this.consume(tx, invite, now);
      await tx.user.update({
        where: { id: user.userId },
        data: { platformRole: "CONTENT_MANAGER" },
      });
      await tx.invite.update({ where: { id: invite.id }, data: { acceptedById: user.userId } });
      await this.recordAcceptance(tx, user.userId, invite);
    });

    return { kind: "CONTENT_TEAM", membership: null };
  }

  /** An invite that can still be accepted, or the precise reason it cannot. */
  private async loadUsable(token: string): Promise<UsableInvite> {
    const invite = await this.prisma.invite.findUnique({
      where: { tokenHash: this.tokens.hashToken(token) },
      include: { institution: true },
    });

    if (!invite) {
      throw inviteNotFound();
    }

    if (invite.status === "ACCEPTED") {
      throw alreadyAccepted();
    }

    if (invite.status === "REVOKED") {
      throw new GoneException({
        code: "INVITE_REVOKED",
        message: `This invitation has been withdrawn. Ask ${whoToAsk(invite)} for a new one.`,
      });
    }

    if (invite.status === "EXPIRED" || invite.expiresAt <= new Date()) {
      if (invite.status === "PENDING") {
        await this.prisma.invite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
      }

      throw new GoneException({
        code: "INVITE_EXPIRED",
        message: `This invitation has expired. Ask ${whoToAsk(invite)} to send it again.`,
      });
    }

    if (
      invite.institution &&
      (invite.institution.status !== "ACTIVE" || invite.institution.archivedAt)
    ) {
      throw new GoneException({
        code: "INSTITUTION_UNAVAILABLE",
        message: "This institution is not accepting new members.",
      });
    }

    return invite;
  }

  /** Marks the invite accepted — conditionally, so only one acceptance wins. */
  private async consume(tx: Prisma.TransactionClient, invite: Invite, now: Date): Promise<void> {
    const { count } = await tx.invite.updateMany({
      where: { id: invite.id, status: "PENDING" },
      data: { status: "ACCEPTED", acceptedAt: now },
    });

    if (count === 0) {
      throw alreadyAccepted();
    }
  }

  private async grantMembership(
    tx: Prisma.TransactionClient,
    userId: string,
    invite: InstitutionInvite,
    now: Date,
  ): Promise<void> {
    await tx.membership.upsert({
      where: { userId_institutionId: { userId, institutionId: invite.institutionId } },
      create: {
        userId,
        institutionId: invite.institutionId,
        role: invite.role,
        status: "ACTIVE",
        joinedAt: now,
      },
      update: { role: invite.role, status: "ACTIVE", joinedAt: now },
    });

    // Every learner starts as an Explorer, the first of the MVP's three states.
    if (invite.role === "LEARNER" && !(await tx.learnerProfile.findUnique({ where: { userId } }))) {
      await tx.learnerProfile.create({
        data: {
          userId,
          state: "EXPLORER",
          stateChanges: {
            create: { toState: "EXPLORER", reason: "Joined through an invitation" },
          },
        },
      });
    }
  }

  private recordAcceptance(
    tx: Prisma.TransactionClient,
    userId: string,
    invite: Invite,
  ): Promise<unknown> {
    return tx.auditEvent.create({
      data: {
        institutionId: invite.institutionId,
        actorUserId: userId,
        action: "invite.accepted",
        entityType: "Invite",
        entityId: invite.id,
        metadata: invite.platformRole
          ? { platformRole: invite.platformRole }
          : { role: invite.role },
      },
    });
  }

  private async findInInstitution(
    institutionId: string,
    inviteId: string,
  ): Promise<InviteWithInviter> {
    // Scoped to the institution in the path, so an id from elsewhere is a 404.
    const invite = await this.prisma.invite.findFirst({
      where: { id: inviteId, institutionId },
      include: withInviter,
    });

    if (!invite) {
      throw inviteNotFound();
    }

    return invite;
  }

  private sendInvite(
    invite: InviteWithInviter,
    institution: Institution,
    token: string,
  ): Promise<EmailDeliveryStatus> {
    const ttlHours = this.config.getOrThrow<number>("INVITE_TTL_HOURS");

    return this.mail.sendInvite({
      to: invite.email,
      institutionId: institution.id,
      institutionName: institution.name,
      inviterName: invite.invitedBy
        ? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}`
        : "FARMCLUB OS",
      role: institutionRoleOf(invite),
      expiresInDays: Math.max(1, Math.round(ttlHours / 24)),
      acceptUrl: webappLink(this.config.getOrThrow<string>("WEBAPP_URL"), "accept-invite", {
        token,
      }),
    });
  }

  private audit(
    tx: Prisma.TransactionClient,
    user: AuthenticatedUser,
    institutionId: string,
    inviteId: string,
    action: string,
  ): Promise<unknown> {
    return tx.auditEvent.create({
      data: {
        institutionId,
        actorUserId: user.userId,
        action,
        entityType: "Invite",
        entityId: inviteId,
      },
    });
  }

  private inviteExpiry(now: Date): Date {
    return new Date(now.getTime() + this.config.getOrThrow<number>("INVITE_TTL_HOURS") * 3_600_000);
  }
}

/** A status filter that treats a lapsed PENDING invite as EXPIRED. */
function statusFilter(
  status: InviteListQueryDto["status"],
  now: Date,
): Prisma.InviteWhereInput {
  switch (status) {
    case undefined:
      return {};
    case "PENDING":
      return { status: "PENDING", expiresAt: { gt: now } };
    case "EXPIRED":
      return { OR: [{ status: "EXPIRED" }, { status: "PENDING", expiresAt: { lte: now } }] };
    default:
      return { status };
  }
}

function toInviteView(invite: InviteWithInviter, now = new Date()): InviteView {
  return {
    id: invite.id,
    email: invite.email,
    role: institutionRoleOf(invite),
    status: invite.status === "PENDING" && invite.expiresAt <= now ? "EXPIRED" : invite.status,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    acceptedAt: invite.acceptedAt,
    revokedAt: invite.revokedAt,
    invitedBy: invite.invitedBy,
  };
}
