import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import type { Institution, Prisma } from "../../generated/prisma/client.js";
import type { CohortStatus } from "../../generated/prisma/enums.js";
import { isUniqueConstraintError } from "../../lib/database/prisma-errors.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { AuthService } from "../auth/auth.service.js";
import { IndependentLearnersService } from "./independent-learners.service.js";
import type { StartedPathwayView } from "./independent-learners.types.js";

/** A cohort that takes nobody new; its learners can still finish. */
const CLOSED: CohortStatus[] = ["COMPLETED", "CANCELLED"];

const cohortFields = { id: true, status: true, archivedAt: true } as const;
const enrolmentFields = { id: true, status: true } as const;

type SelfPacedCohort = Prisma.CohortGetPayload<{ select: typeof cohortFields }>;
type EnrolmentRow = Prisma.EnrolmentGetPayload<{ select: typeof enrolmentFields }>;

/*
  Starting a pathway on one's own.

  Anyone signed in may start any published pathway. Doing so makes them a
  learner in FARMCLUB's home for independent learners and enrols them on the
  pathway's self-paced cohort there, so their progress and quiz attempts are
  an enrolment's like everyone else's (IndependentLearnersService). Their
  session then moves to the home, since every learner-side lookup reads the
  institution the session is in.

  Starting again changes nothing, and brings back someone who was withdrawn,
  with the progress they had: withdrawing never deletes it.
*/
@Injectable()
export class SelfEnrolmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly independent: IndependentLearnersService,
    private readonly auth: AuthService,
  ) {}

  async start(user: AuthenticatedUser, pathwaySlug: string): Promise<StartedPathwayView> {
    const pathway = await this.prisma.pathway.findFirst({
      where: { slug: pathwaySlug, status: "PUBLISHED", archivedAt: null },
      select: { id: true, slug: true, title: true },
    });

    if (!pathway) {
      throw new NotFoundException({ code: "NOT_FOUND", message: "Pathway not found." });
    }

    await this.assertNotTakingElsewhere(user, pathway.id);

    const home = await this.independent.home();
    const cohort = await this.selfPacedCohort(home, pathway.id);
    const now = new Date();

    const enrolment = await this.prisma.$transaction(async (tx) => {
      await this.independent.joinAsLearner(
        tx,
        user.userId,
        home.id,
        now,
        "Started a pathway on their own",
      );

      const existing = await tx.enrolment.findUnique({
        where: { cohortId_userId: { cohortId: cohort.id, userId: user.userId } },
        select: enrolmentFields,
      });

      // Already under way, or finished: starting again changes nothing.
      if (existing && (existing.status === "ACTIVE" || existing.status === "COMPLETED")) {
        return existing;
      }

      if (CLOSED.includes(cohort.status) || cohort.archivedAt) {
        throw new ConflictException({
          code: "PATHWAY_NOT_TAKING_LEARNERS",
          message: "This pathway is not taking new learners at the moment.",
        });
      }

      const started: EnrolmentRow = existing
        ? await tx.enrolment.update({
            where: { id: existing.id },
            data: { status: "ACTIVE", withdrawnAt: null },
            select: enrolmentFields,
          })
        : await tx.enrolment.create({
            data: {
              cohortId: cohort.id,
              userId: user.userId,
              institutionId: home.id,
              status: "ACTIVE",
              startedAt: now,
            },
            select: enrolmentFields,
          });

      await tx.auditEvent.create({
        data: {
          institutionId: home.id,
          actorUserId: user.userId,
          action: existing ? "enrolment.resumed" : "enrolment.started",
          entityType: "Enrolment",
          entityId: started.id,
          metadata: { pathwayId: pathway.id },
        },
      });

      return started;
    });

    return {
      enrolmentId: enrolment.id,
      status: enrolment.status,
      session:
        user.institutionId === home.id ? null : await this.auth.switchInstitution(user, home.id),
    };
  }

  /**
   * Someone taking the pathway with an institution already has their record
   * of it there. A second enrolment would be a second, empty one.
   */
  private async assertNotTakingElsewhere(user: AuthenticatedUser, pathwayId: string) {
    const elsewhere = await this.prisma.enrolment.findFirst({
      where: {
        userId: user.userId,
        status: { in: ["INVITED", "ACTIVE", "COMPLETED"] },
        cohort: { pathwayId, archivedAt: null },
        institution: { kind: "STANDARD", status: "ACTIVE", archivedAt: null },
      },
      select: { institution: { select: { name: true } } },
    });

    if (elsewhere) {
      throw new ConflictException({
        code: "ENROLLED_WITH_INSTITUTION",
        message:
          `You are taking this pathway with ${elsewhere.institution.name}. Switch to it from ` +
          "your account menu to carry on.",
      });
    }
  }

  /** The pathway's always-open cohort in the home, made the first time it is needed. */
  private async selfPacedCohort(home: Institution, pathwayId: string): Promise<SelfPacedCohort> {
    const find = () =>
      this.prisma.cohort.findFirst({
        where: { pathwayId, selfPaced: true },
        select: cohortFields,
      });

    const existing = await find();

    if (existing) {
      return existing;
    }

    try {
      return await this.prisma.cohort.create({
        data: {
          institutionId: home.id,
          pathwayId,
          name: "Self-paced",
          status: "OPEN",
          deliveryMode: "ONLINE",
          selfPaced: true,
        },
        select: cohortFields,
      });
    } catch (error) {
      // Another request made it first; a partial unique index allows one.
      const winner = isUniqueConstraintError(error) ? await find() : null;

      if (!winner) {
        throw error;
      }

      return winner;
    }
  }
}
