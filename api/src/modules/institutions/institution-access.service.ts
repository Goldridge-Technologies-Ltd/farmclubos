import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import type { Institution } from "../../generated/prisma/client.js";
import { PrismaService } from "../../lib/database/prisma.service.js";

export type InstitutionAccess = {
  institution: Institution;
  isPlatformAdmin: boolean;
};

const notFound = () =>
  new NotFoundException({ code: "INSTITUTION_NOT_FOUND", message: "Institution not found." });

/**
 * Who may see or manage a particular institution.
 *
 * Checked against the database, not the access token: the token only knows the
 * active institution, and can be minutes stale — too stale for a decision like
 * who may invite people into an institution. A user with no claim to an
 * institution gets a 404, so an id is never confirmed to them; a member who
 * lacks the role gets a 403, since they already know it exists.
 */
@Injectable()
export class InstitutionAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** A platform admin, or any active member of an active institution. */
  async assertCanView(
    user: AuthenticatedUser,
    institutionId: string,
  ): Promise<InstitutionAccess> {
    const { institution, isPlatformAdmin, membership } = await this.load(user, institutionId);

    if (!isPlatformAdmin && !isActiveMember(membership, institution)) {
      throw notFound();
    }

    return { institution, isPlatformAdmin };
  }

  /** A platform admin, or an active institution admin of an active institution. */
  async assertCanManage(
    user: AuthenticatedUser,
    institutionId: string,
  ): Promise<InstitutionAccess> {
    const { institution, isPlatformAdmin, membership } = await this.load(user, institutionId);

    if (isPlatformAdmin) {
      return { institution, isPlatformAdmin };
    }

    if (!isActiveMember(membership, institution)) {
      throw notFound();
    }

    if (membership?.role !== "INSTITUTION_ADMIN") {
      throw new ForbiddenException({
        code: "INSUFFICIENT_ROLE",
        message: "Only an institution administrator can do this.",
      });
    }

    return { institution, isPlatformAdmin };
  }

  /** For platform-wide routes, confirming the token's role is still current. */
  async assertPlatformAdmin(user: AuthenticatedUser): Promise<void> {
    const account = await this.loadAccount(user);

    if (account.platformRole !== "PLATFORM_ADMIN") {
      throw new ForbiddenException({
        code: "INSUFFICIENT_ROLE",
        message: "You do not have permission to do this.",
      });
    }
  }

  private async load(user: AuthenticatedUser, institutionId: string) {
    const [account, institution, membership] = await Promise.all([
      this.loadAccount(user),
      this.prisma.institution.findFirst({ where: { id: institutionId, archivedAt: null } }),
      this.prisma.membership.findUnique({
        where: { userId_institutionId: { userId: user.userId, institutionId } },
        select: { role: true, status: true },
      }),
    ]);

    if (!institution) {
      throw notFound();
    }

    return {
      institution,
      membership,
      isPlatformAdmin: account.platformRole === "PLATFORM_ADMIN",
    };
  }

  private async loadAccount(user: AuthenticatedUser) {
    const account = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { platformRole: true, deactivatedAt: true },
    });

    if (!account || account.deactivatedAt) {
      throw new UnauthorizedException({
        code: "ACCOUNT_DEACTIVATED",
        message:
          "This account has been deactivated. Contact your institution's administrator.",
      });
    }

    return account;
  }
}

function isActiveMember(
  membership: { status: string } | null,
  institution: Institution,
): boolean {
  return membership?.status === "ACTIVE" && institution.status === "ACTIVE";
}
