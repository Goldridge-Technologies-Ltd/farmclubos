import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import type { Institution, Prisma } from "../../generated/prisma/client.js";
import { isUniqueConstraintError } from "../../lib/database/prisma-errors.js";
import { PrismaService } from "../../lib/database/prisma.service.js";

/*
  The home FARMCLUB runs for people who sign up on their own.

  An independent learner is an ordinary learner member of the one institution
  of kind INDEPENDENT_LEARNERS, and starts a pathway on its always-open,
  self-paced cohort. That is the point: progress, quizzes and every tenancy
  rule then hold for them exactly as for anyone an institution invited, and
  the platform team manages them through the same screens (api/AGENTS.md).

  It is made the first time it is needed rather than seeded, so every database
  has it without anyone remembering to create it, and a partial unique index
  keeps it to one when two requests race to make it.
*/

const HOME_NAME = "FARMCLUB Independent Learners";
const HOME_SLUG = "farmclub-independent-learners";

@Injectable()
export class IndependentLearnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async home(): Promise<Institution> {
    const existing = await this.find();

    if (existing) {
      return existing;
    }

    try {
      return await this.create(HOME_SLUG);
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      // Another request made it first — or a partner institution already
      // has the slug, and then there is still no home to hand back.
      return (await this.find()) ?? this.create(`${HOME_SLUG}-${randomBytes(3).toString("hex")}`);
    }
  }

  /**
   * Makes the user a learner in the home, with a learner profile, unless they
   * already belong. A suspended membership is how the platform team stops
   * someone, so it is refused rather than quietly reinstated.
   */
  async joinAsLearner(
    tx: Prisma.TransactionClient,
    userId: string,
    homeId: string,
    now: Date,
    reason: string,
  ): Promise<void> {
    const key = { userId_institutionId: { userId, institutionId: homeId } };
    const membership = await tx.membership.findUnique({ where: key, select: { status: true } });

    if (membership?.status === "SUSPENDED") {
      throw new ForbiddenException({
        code: "MEMBERSHIP_SUSPENDED",
        message: "Your account cannot start pathways on its own. Contact FARMCLUB OS for help.",
      });
    }

    if (!membership) {
      await tx.membership.create({
        data: { userId, institutionId: homeId, role: "LEARNER", status: "ACTIVE", joinedAt: now },
      });
    } else if (membership.status !== "ACTIVE") {
      // Invited and never accepted, or left and come back.
      await tx.membership.update({ where: key, data: { status: "ACTIVE", joinedAt: now } });
    }

    // Every learner starts as an Explorer, the first of the MVP's three states.
    if (!(await tx.learnerProfile.findUnique({ where: { userId }, select: { id: true } }))) {
      await tx.learnerProfile.create({
        data: {
          userId,
          state: "EXPLORER",
          stateChanges: { create: { toState: "EXPLORER", reason } },
        },
      });
    }
  }

  private find(): Promise<Institution | null> {
    return this.prisma.institution.findFirst({ where: { kind: "INDEPENDENT_LEARNERS" } });
  }

  private create(slug: string): Promise<Institution> {
    return this.prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: {
          slug,
          name: HOME_NAME,
          type: "OTHER",
          kind: "INDEPENDENT_LEARNERS",
          status: "ACTIVE",
          // FARMCLUB's own address: the home has no contact of its own.
          contactEmail: addressOf(this.config.getOrThrow<string>("MAIL_FROM")),
        },
      });

      await tx.auditEvent.create({
        data: {
          institutionId: institution.id,
          action: "institution.created",
          entityType: "Institution",
          entityId: institution.id,
          metadata: { kind: "INDEPENDENT_LEARNERS" },
        },
      });

      return institution;
    });
  }
}

/** The bare address in a sender such as `FARMCLUB OS <no-reply@farmclubos.com>`. */
function addressOf(sender: string): string {
  return (/<([^>]+)>/.exec(sender)?.[1] ?? sender).trim().toLowerCase();
}
