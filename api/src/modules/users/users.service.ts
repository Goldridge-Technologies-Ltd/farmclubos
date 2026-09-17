import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { webappLink } from "../../common/utils/webapp-link.js";
import type { LearnerProfile, Prisma, User } from "../../generated/prisma/client.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { MailService } from "../../lib/mail/mail.service.js";
import { PasswordService } from "../auth/password.service.js";
import type {
  ChangePasswordDto,
  UpdateLearnerProfileDto,
  UpdateProfileDto,
} from "./dto/user-request.dto.js";
import type { LearnerProfileView, ProfileView } from "./users.types.js";

type AccountWithProfile = User & { learnerProfile: LearnerProfile | null };

const sessionEnded = () =>
  new UnauthorizedException({
    code: "INVALID_REFRESH_TOKEN",
    message: "Your session has ended. Sign in again.",
  });

/** The signed-in user's own account: their profile and their password. */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly passwords: PasswordService,
    private readonly mail: MailService,
  ) {}

  async getProfile(user: AuthenticatedUser): Promise<ProfileView> {
    return toProfileView(await this.loadAccount(user));
  }

  async updateProfile(user: AuthenticatedUser, input: UpdateProfileDto): Promise<ProfileView> {
    const account = await this.loadAccount(user);
    const { learnerProfile, ...names } = input;

    if (learnerProfile && !account.learnerProfile) {
      throw new BadRequestException({
        code: "NOT_A_LEARNER",
        message: "Only a learner has learner details to update.",
      });
    }

    const learnerData = learnerProfile ? toLearnerProfileData(learnerProfile) : null;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(names).length > 0) {
        await tx.user.update({ where: { id: account.id }, data: names });
      }

      if (learnerData && Object.keys(learnerData).length > 0) {
        await tx.learnerProfile.update({ where: { userId: account.id }, data: learnerData });
      }
    });

    return this.getProfile(user);
  }

  /**
   * Changes the password from settings. Unlike a reset, the device making the
   * change stays signed in; every other session ends, and so does any reset
   * link still outstanding, so it cannot undo the change.
   */
  async changePassword(user: AuthenticatedUser, input: ChangePasswordDto): Promise<void> {
    const account = await this.loadAccount(user);

    // 400 rather than 401: to the web app a 401 means the session has expired,
    // and a mistyped password must not sign the user out.
    if (
      !account.passwordHash ||
      !(await this.passwords.verify(account.passwordHash, input.currentPassword))
    ) {
      throw new BadRequestException({
        code: "CURRENT_PASSWORD_INCORRECT",
        message: "Your current password is incorrect.",
      });
    }

    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException({
        code: "PASSWORD_UNCHANGED",
        message: "Choose a password different from your current one.",
      });
    }

    const session = await this.prisma.authSession.findUnique({
      where: { id: user.sessionId },
      select: { familyId: true, revokedAt: true },
    });

    if (!session || session.revokedAt) {
      throw sessionEnded();
    }

    const passwordHash = await this.passwords.hash(input.newPassword);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: account.id }, data: { passwordHash } });

      await tx.authSession.updateMany({
        where: { userId: account.id, revokedAt: null, familyId: { not: session.familyId } },
        data: { revokedAt: now },
      });

      await tx.passwordResetToken.updateMany({
        where: { userId: account.id, usedAt: null },
        data: { usedAt: now },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: account.id,
          action: "user.password_changed",
          entityType: "User",
          entityId: account.id,
        },
      });
    });

    await this.mail.sendPasswordChanged({
      to: account.email,
      userId: account.id,
      firstName: account.firstName,
      signedOut: "other-devices",
      forgotPasswordUrl: webappLink(
        this.config.getOrThrow<string>("WEBAPP_URL"),
        "forgot-password",
      ),
    });
  }

  private async loadAccount(user: AuthenticatedUser): Promise<AccountWithProfile> {
    const account = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: { learnerProfile: true },
    });

    if (!account || account.deactivatedAt) {
      throw sessionEnded();
    }

    return account;
  }
}

/**
 * Prisma update data from the request: an emptied text field is cleared to
 * null rather than stored as "", and the date must be in the past.
 */
function toLearnerProfileData(
  input: UpdateLearnerProfileDto,
): Prisma.LearnerProfileUpdateInput {
  const data: Prisma.LearnerProfileUpdateInput = {};

  for (const field of ["phone", "location", "bio", "goals"] as const) {
    if (input[field] !== undefined) {
      data[field] = input[field] === "" ? null : input[field];
    }
  }

  for (const field of ["gender", "educationLevel", "employmentStatus"] as const) {
    if (input[field] !== undefined) {
      data[field] = input[field];
    }
  }

  if (input.dateOfBirth !== undefined) {
    if (input.dateOfBirth === null) {
      data.dateOfBirth = null;
    } else {
      const date = new Date(`${input.dateOfBirth}T00:00:00.000Z`);

      if (Number.isNaN(date.getTime()) || date >= new Date()) {
        // The same shape ValidationPipe produces, so the filter reports it as
        // VALIDATION_FAILED with this line in `details`.
        throw new BadRequestException(["dateOfBirth must be a real date in the past"]);
      }

      data.dateOfBirth = date;
    }
  }

  return data;
}

function toLearnerProfileView(profile: LearnerProfile): LearnerProfileView {
  return {
    state: profile.state,
    phone: profile.phone,
    dateOfBirth: profile.dateOfBirth?.toISOString().slice(0, 10) ?? null,
    gender: profile.gender,
    educationLevel: profile.educationLevel,
    employmentStatus: profile.employmentStatus,
    location: profile.location,
    bio: profile.bio,
    goals: profile.goals,
  };
}

function toProfileView(account: AccountWithProfile): ProfileView {
  return {
    id: account.id,
    email: account.email,
    firstName: account.firstName,
    lastName: account.lastName,
    platformRole: account.platformRole,
    emailVerifiedAt: account.emailVerifiedAt,
    lastLoginAt: account.lastLoginAt,
    createdAt: account.createdAt,
    learnerProfile: account.learnerProfile ? toLearnerProfileView(account.learnerProfile) : null,
  };
}
