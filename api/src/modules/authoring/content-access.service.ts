import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";

/*
  Who may change the Academy: the platform's content team — platform
  administrators and content managers. The catalogue belongs to no
  institution, so no institution role grants it.

  Checked against the database on every request, as InstitutionAccessService
  does for institutions: a role taken away takes effect at once, not when the
  access token next refreshes.
*/
@Injectable()
export class ContentAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanAuthor(user: AuthenticatedUser): Promise<void> {
    const account = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { platformRole: true, deactivatedAt: true },
    });

    if (!account || account.deactivatedAt) {
      throw new UnauthorizedException({
        code: "ACCOUNT_DEACTIVATED",
        message: "This account has been deactivated.",
      });
    }

    if (account.platformRole !== "PLATFORM_ADMIN" && account.platformRole !== "CONTENT_MANAGER") {
      throw new ForbiddenException({
        code: "INSUFFICIENT_ROLE",
        message: "Only the content team can change the Academy.",
      });
    }
  }
}
