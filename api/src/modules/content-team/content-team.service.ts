import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { normalizeEmail } from "../../common/utils/normalize-email.js";
import { webappLink } from "../../common/utils/webapp-link.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { PlatformRole } from "../../generated/prisma/enums.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService, type EmailDeliveryStatus } from "../../lib/mail/mail.service.js";
import { TokenService } from "../auth/token.service.js";
import { InstitutionAccessService } from "../institutions/institution-access.service.js";
import type {
  ContentTeamInviteView,
  ContentTeamMemberView,
  ContentTeamRole,
  ContentTeamView,
  IssuedContentTeamInviteView,
  RemovedMemberView,
} from "./content-team.types.js";
import type { InviteContentManagerDto } from "./dto/content-team-request.dto.js";

const withInviter = {
  invitedBy: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.InviteInclude;

type TeamInvite = Prisma.InviteGetPayload<{ include: typeof withInviter }>;

const memberSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  platformRole: true,
} satisfies Prisma.UserSelect;

type Member = Prisma.UserGetPayload<{ select: typeof memberSelect }>;

const TEAM_ROLES: ContentTeamRole[] = ["PLATFORM_ADMIN", "CONTENT_MANAGER"];

const alreadyOnTeam = () =>
  new ConflictException({
    code: "ALREADY_CONTENT_TEAM",
    message: "This person is already on the content team.",
  });

/*
  The content team, as a platform administrator runs it: who is on it, the
  invitations still open, and taking a content manager off it. Accepting an
  invitation belongs to the invites module, through the same link as an
  institution's invitation.

  The team belongs to no institution, so nothing here filters on one and its
  audit events carry none. Every method checks against the database that the
  caller is a platform administrator, and a content manager's own access is
  checked the same way, so taking the role away stops it at once.
*/
@Injectable()
export class ContentTeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly access: InstitutionAccessService,
    private readonly tokens: TokenService,
    private readonly mail: MailService,
  ) {}

  async list(user: AuthenticatedUser): Promise<ContentTeamView> {
    await this.access.assertPlatformAdmin(user);

    const now = new Date();
    const [members, invitations] = await Promise.all([
      this.prisma.user.findMany({
        where: { platformRole: { in: TEAM_ROLES }, deactivatedAt: null },
        select: memberSelect,
        // The enum's own order puts platform administrators first.
        orderBy: [{ platformRole: "asc" }, { firstName: "asc" }, { lastName: "asc" }],
      }),
      this.prisma.invite.findMany({
        where: { platformRole: "CONTENT_MANAGER", status: { in: ["PENDING", "EXPIRED"] } },
        include: withInviter,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      members: members.filter(onTeam).map(toMemberView),
      invitations: invitations.map((invite) => toInviteView(invite, now)),
    };
  }

  /** Emails an invitation; one still open to the same address is replaced. */
  async invite(
    user: AuthenticatedUser,
    input: InviteContentManagerDto,
  ): Promise<IssuedContentTeamInviteView> {
    await this.access.assertPlatformAdmin(user);

    const email = normalizeEmail(input.email);
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { platformRole: true },
    });

    if (existing && existing.platformRole !== "NONE") {
      throw alreadyOnTeam();
    }

    const token = this.tokens.generateOpaqueToken();
    const now = new Date();

    const invite = await this.prisma.$transaction(async (tx) => {
      // At most one open invitation per address: the newest wins.
      await tx.invite.updateMany({
        where: { platformRole: "CONTENT_MANAGER", email, status: "PENDING" },
        data: { status: "REVOKED", revokedAt: now },
      });

      const created = await tx.invite.create({
        data: {
          email,
          platformRole: "CONTENT_MANAGER",
          tokenHash: this.tokens.hashToken(token),
          expiresAt: this.expiry(now),
          invitedById: user.userId,
        },
        include: withInviter,
      });

      await this.audit(tx, user, "invite.issued", "Invite", created.id, {
        email,
        platformRole: "CONTENT_MANAGER",
      });

      return created;
    });

    return { ...toInviteView(invite), emailStatus: await this.send(invite, token) };
  }

  /** A fresh link and expiry, for an invitation that was lost or lapsed. */
  async resend(user: AuthenticatedUser, inviteId: string): Promise<IssuedContentTeamInviteView> {
    await this.access.assertPlatformAdmin(user);

    const invite = await this.find(inviteId);

    if (invite.status === "ACCEPTED" || invite.status === "REVOKED") {
      throw new ConflictException({
        code: "INVITE_NOT_PENDING",
        message: "Only a pending or expired invitation can be sent again.",
      });
    }

    const token = this.tokens.generateOpaqueToken();

    const reissued = await this.prisma.$transaction(async (tx) => {
      // The new token hash replaces the old one, so the old link stops working.
      const updated = await tx.invite.update({
        where: { id: invite.id },
        data: {
          tokenHash: this.tokens.hashToken(token),
          expiresAt: this.expiry(new Date()),
          status: "PENDING",
        },
        include: withInviter,
      });

      await this.audit(tx, user, "invite.resent", "Invite", invite.id);

      return updated;
    });

    return { ...toInviteView(reissued), emailStatus: await this.send(reissued, token) };
  }

  /** Withdraws an invitation. Withdrawing one already withdrawn is done. */
  async revoke(user: AuthenticatedUser, inviteId: string): Promise<ContentTeamInviteView> {
    await this.access.assertPlatformAdmin(user);

    const invite = await this.find(inviteId);

    if (invite.status === "ACCEPTED") {
      throw new ConflictException({
        code: "INVITE_ALREADY_ACCEPTED",
        message: "This invitation has been accepted. Remove them from the content team instead.",
      });
    }

    if (invite.status === "REVOKED") {
      return toInviteView(invite);
    }

    const revoked = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.invite.update({
        where: { id: invite.id },
        data: { status: "REVOKED", revokedAt: new Date() },
        include: withInviter,
      });

      await this.audit(tx, user, "invite.revoked", "Invite", invite.id);

      return updated;
    });

    return toInviteView(revoked);
  }

  /**
   * Takes a content manager off the team. The role goes; the account, its
   * institution memberships and everything it built stay. A platform
   * administrator is on the team by role and cannot be taken off it, and
   * removing someone already off it is done, recording nothing.
   */
  async remove(user: AuthenticatedUser, userId: string): Promise<RemovedMemberView> {
    await this.access.assertPlatformAdmin(user);

    const member = await this.prisma.user.findUnique({
      where: { id: userId },
      select: memberSelect,
    });

    if (!member) {
      throw new NotFoundException({ code: "MEMBER_NOT_FOUND", message: "There is no such person." });
    }

    if (member.platformRole === "PLATFORM_ADMIN") {
      throw new ConflictException({
        code: "PLATFORM_ADMIN_ON_TEAM",
        message: "Platform administrators are always on the content team.",
      });
    }

    const removed = {
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
    };

    if (member.platformRole === "NONE") {
      return removed;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { platformRole: "NONE" },
        select: { id: true },
      });
      await this.audit(tx, user, "content_team.member_removed", "User", userId, {
        email: member.email,
      });
    });

    return removed;
  }

  /** Content-team invitations only: an institution's invitation id here is a 404. */
  private async find(inviteId: string): Promise<TeamInvite> {
    const invite = await this.prisma.invite.findFirst({
      where: { id: inviteId, platformRole: "CONTENT_MANAGER" },
      include: withInviter,
    });

    if (!invite) {
      throw new NotFoundException({ code: "INVITE_NOT_FOUND", message: "Invitation not found." });
    }

    return invite;
  }

  private send(invite: TeamInvite, token: string): Promise<EmailDeliveryStatus> {
    const ttlHours = this.config.getOrThrow<number>("INVITE_TTL_HOURS");

    return this.mail.sendContentTeamInvite({
      to: invite.email,
      inviterName: `${invite.invitedBy.firstName} ${invite.invitedBy.lastName}`,
      expiresInDays: Math.max(1, Math.round(ttlHours / 24)),
      acceptUrl: webappLink(this.config.getOrThrow<string>("WEBAPP_URL"), "accept-invite", {
        token,
      }),
    });
  }

  private audit(
    tx: Prisma.TransactionClient,
    user: AuthenticatedUser,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Prisma.InputJsonObject,
  ): Promise<unknown> {
    return tx.auditEvent.create({
      data: { actorUserId: user.userId, action, entityType, entityId, metadata },
    });
  }

  private expiry(now: Date): Date {
    return new Date(now.getTime() + this.config.getOrThrow<number>("INVITE_TTL_HOURS") * 3_600_000);
  }
}

function onTeam(member: Member): member is Member & { platformRole: ContentTeamRole } {
  return (TEAM_ROLES as PlatformRole[]).includes(member.platformRole);
}

function toMemberView(member: Member & { platformRole: ContentTeamRole }): ContentTeamMemberView {
  return {
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    platformRole: member.platformRole,
  };
}

function toInviteView(invite: TeamInvite, now = new Date()): ContentTeamInviteView {
  return {
    id: invite.id,
    email: invite.email,
    status: invite.status === "PENDING" && invite.expiresAt <= now ? "EXPIRED" : invite.status,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    invitedBy: invite.invitedBy,
  };
}
