import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import type {
  CohortSummaryView,
  CreateCohortInput,
  EnrolInput,
  EnrolmentView,
} from "./cohorts.types.js";

/*
  A learner's own enrolments.

  Every query filters on two things at once: the institution in the access
  token, and the caller. Dropping either is not a small bug — without the
  institution, someone who belongs to two sees both; without the user, they
  see everyone in their cohort. A miss is a 404, never a 403, so an id is
  never confirmed to someone who should not see it (api/AGENTS.md).
*/

/** Withdrawn enrolments are history, not something to carry on with. */
const VISIBLE_STATUSES = ["INVITED", "ACTIVE", "COMPLETED"] as const;

@Injectable()
export class CohortsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(user: AuthenticatedUser): Promise<EnrolmentView[]> {
    // No active institution means no enrolments by definition — a platform
    // admin who belongs to none, for instance. Nothing to ask the database.
    if (!user.institutionId) {
      return [];
    }

    const rows = await this.prisma.enrolment.findMany({
      where: {
        userId: user.userId,
        institutionId: user.institutionId,
        status: { in: [...VISIBLE_STATUSES] },
        cohort: { archivedAt: null },
      },
      orderBy: { enrolledAt: "desc" },
      select: enrolmentSelect,
    });

    return rows.map(toEnrolmentView);
  }

  /**
   * Opens an intake of a pathway for an institution.
   *
   * The caller's right to manage the institution is checked by the controller
   * through InstitutionAccessService; what is checked here is that the pathway
   * is one that actually exists and is published.
   */
  async createCohort(
    institutionId: string,
    input: CreateCohortInput,
  ): Promise<CohortSummaryView> {
    const pathway = await this.prisma.pathway.findFirst({
      where: { slug: input.pathwaySlug, status: "PUBLISHED", archivedAt: null },
      select: { id: true },
    });

    if (!pathway) {
      throw new BadRequestException({
        code: "PATHWAY_NOT_FOUND",
        message: "There is no published pathway with that slug.",
      });
    }

    const cohort = await this.prisma.cohort.create({
      data: {
        institutionId,
        pathwayId: pathway.id,
        name: input.name,
        code: input.code ?? null,
        status: "OPEN",
        deliveryMode: input.deliveryMode ?? "BLENDED",
        startsOn: toDate(input.startsOn),
        endsOn: toDate(input.endsOn),
        // capacity stays null: a seeded or guessed figure would read as real.
      },
      select: cohortSelect,
    });

    return toCohortView(cohort);
  }

  /**
   * Enrols one of the institution's own members onto a cohort.
   *
   * `institutionId` is denormalised onto the enrolment so every tenant-scoped
   * query has one filter rather than a join, and it is taken from the cohort
   * rather than the request so the two can never disagree.
   */
  async enrol(
    institutionId: string,
    cohortId: string,
    input: EnrolInput,
  ): Promise<EnrolmentView> {
    const cohort = await this.prisma.cohort.findFirst({
      where: { id: cohortId, institutionId, archivedAt: null },
      select: { id: true },
    });

    if (!cohort) {
      throw notFound();
    }

    const email = input.email.trim().toLowerCase();
    const membership = await this.prisma.membership.findFirst({
      where: { institutionId, status: "ACTIVE", user: { email } },
      select: { userId: true },
    });

    if (!membership) {
      throw new BadRequestException({
        code: "NOT_A_MEMBER",
        message: "That person is not an active member of this institution.",
      });
    }

    const enrolment = await this.prisma.enrolment.upsert({
      where: { cohortId_userId: { cohortId, userId: membership.userId } },
      // Enrolling twice is not an error; it must not reset their progress.
      update: {},
      create: {
        cohortId,
        userId: membership.userId,
        institutionId,
        status: "ACTIVE",
      },
      select: enrolmentSelect,
    });

    return toEnrolmentView(enrolment);
  }

  async getMine(user: AuthenticatedUser, enrolmentId: string): Promise<EnrolmentView> {
    if (!user.institutionId) {
      throw notFound();
    }

    const row = await this.prisma.enrolment.findFirst({
      where: {
        id: enrolmentId,
        userId: user.userId,
        institutionId: user.institutionId,
      },
      select: enrolmentSelect,
    });

    if (!row) {
      throw notFound();
    }

    return toEnrolmentView(row);
  }
}

const cohortSelect = {
  id: true,
  name: true,
  code: true,
  status: true,
  deliveryMode: true,
  startsOn: true,
  endsOn: true,
  pathway: { select: { id: true, slug: true, title: true, summary: true, level: true } },
} as const;

const enrolmentSelect = {
  id: true,
  status: true,
  progressPercent: true,
  enrolledAt: true,
  startedAt: true,
  completedAt: true,
  cohort: {
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
      deliveryMode: true,
      startsOn: true,
      endsOn: true,
      pathway: {
        select: { id: true, slug: true, title: true, summary: true, level: true },
      },
    },
  },
} as const;

type EnrolmentRow = Omit<EnrolmentView, "cohort"> & {
  cohort: Omit<CohortSummaryView, "startsOn" | "endsOn"> & {
    startsOn: Date | null;
    endsOn: Date | null;
  };
};

type CohortRow = Omit<CohortSummaryView, "startsOn" | "endsOn"> & {
  startsOn: Date | null;
  endsOn: Date | null;
};

function toCohortView(row: CohortRow): CohortSummaryView {
  return { ...row, startsOn: toPlainDate(row.startsOn), endsOn: toPlainDate(row.endsOn) };
}

/** A plain `YYYY-MM-DD` becomes midnight UTC, so no timezone can shift the day. */
function toDate(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function toEnrolmentView(row: EnrolmentRow): EnrolmentView {
  return {
    id: row.id,
    status: row.status,
    progressPercent: row.progressPercent,
    enrolledAt: row.enrolledAt,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    cohort: {
      ...row.cohort,
      startsOn: toPlainDate(row.cohort.startsOn),
      endsOn: toPlainDate(row.cohort.endsOn),
    },
  };
}

/** A DATE column is a day, not an instant: sending one invites a timezone to move it. */
function toPlainDate(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function notFound() {
  return new NotFoundException({
    code: "NOT_FOUND",
    message: "That enrolment does not exist.",
  });
}
