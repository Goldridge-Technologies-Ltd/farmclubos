import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ownEnrolment } from "../../common/auth/own-enrolment.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { CohortStatus } from "../../generated/prisma/enums.js";
import { isUniqueConstraintError } from "../../lib/database/prisma-errors.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import type {
  CohortDetailView,
  CohortListItemView,
  CohortSummaryView,
  CohortEnrolmentView,
  CreateCohortInput,
  EnrolInput,
  EnrolmentView,
  UpdateCohortInput,
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

/**
 * An intake that has finished, or never ran. Nobody new can be enrolled onto
 * one — but the learners already on it can still finish their own work:
 * progress belongs to an enrolment, so closing must not strand it.
 */
const CLOSED_STATUSES: CohortStatus[] = ["COMPLETED", "CANCELLED"];

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
        ...ownEnrolment(user.userId, user.institutionId),
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
    actorId: string,
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

    const cohort = await this.prisma
      .$transaction(async (tx) => {
        const created = await tx.cohort.create({
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

        await audit(tx, actorId, institutionId, "cohort.created", "Cohort", created.id);

        return created;
      })
      .catch(rethrowCodeTaken);

    return toCohortView(cohort);
  }

  /**
   * Changes a cohort's name, code, delivery mode or dates. Never its pathway:
   * every learner's progress hangs off it.
   *
   * Only what actually differs is written and recorded. The web app sends
   * every field each time, and an audit trail listing fields nobody changed
   * would be no use to anyone reading it.
   */
  async updateCohort(
    actorId: string,
    institutionId: string,
    cohortId: string,
    input: UpdateCohortInput,
  ): Promise<CohortSummaryView> {
    const current = await this.prisma.cohort.findFirst({
      where: { id: cohortId, institutionId, archivedAt: null },
      select: cohortSelect,
    });

    if (!current) {
      throw notFound();
    }

    const code = input.code === undefined ? undefined : input.code || null;
    const startsOn = input.startsOn === undefined ? undefined : toDate(input.startsOn);
    const endsOn = input.endsOn === undefined ? undefined : toDate(input.endsOn);
    const data: Prisma.CohortUpdateInput = {};

    if (input.name !== undefined && input.name !== current.name) data.name = input.name;
    if (code !== undefined && code !== current.code) data.code = code;
    if (input.deliveryMode !== undefined && input.deliveryMode !== current.deliveryMode) {
      data.deliveryMode = input.deliveryMode;
    }
    if (startsOn !== undefined && !sameDay(startsOn, current.startsOn)) data.startsOn = startsOn;
    if (endsOn !== undefined && !sameDay(endsOn, current.endsOn)) data.endsOn = endsOn;

    // Judged against the dates the cohort would end up with, so moving only
    // the end date is checked against the start already there.
    const finalStart = startsOn === undefined ? current.startsOn : startsOn;
    const finalEnd = endsOn === undefined ? current.endsOn : endsOn;

    if (finalStart && finalEnd && finalEnd < finalStart) {
      throw new BadRequestException({
        code: "DATES_OUT_OF_ORDER",
        message: "The end date is before the start date.",
      });
    }

    // Saving what is already there is done, not an event.
    if (Object.keys(data).length === 0) {
      return toCohortView(current);
    }

    const cohort = await this.prisma
      .$transaction(async (tx) => {
        const updated = await tx.cohort.update({
          where: { id: cohortId },
          data,
          select: cohortSelect,
        });

        await audit(tx, actorId, institutionId, "cohort.updated", "Cohort", cohortId, {
          fields: Object.keys(data),
        });

        return updated;
      })
      .catch(rethrowCodeTaken);

    return toCohortView(cohort);
  }

  /**
   * The intake has finished. Nobody new can be enrolled, and it moves to the
   * institution's past cohorts. Its learners' enrolments are left alone, so
   * anyone with work outstanding can still finish it; withdrawing is how an
   * institution stops a particular person.
   */
  async closeCohort(
    actorId: string,
    institutionId: string,
    cohortId: string,
  ): Promise<CohortSummaryView> {
    return this.setStatus(actorId, institutionId, cohortId, "COMPLETED", "cohort.closed");
  }

  /** Undoes a close, since closing one by mistake should not be permanent. */
  async reopenCohort(
    actorId: string,
    institutionId: string,
    cohortId: string,
  ): Promise<CohortSummaryView> {
    return this.setStatus(actorId, institutionId, cohortId, "OPEN", "cohort.reopened");
  }

  /**
   * Takes one learner off one cohort. Their progress is kept: enrolling them
   * again resumes it. A finished enrolment cannot be withdrawn — there is
   * nothing left to withdraw them from.
   */
  async withdraw(
    actorId: string,
    institutionId: string,
    cohortId: string,
    enrolmentId: string,
  ): Promise<CohortEnrolmentView> {
    const enrolment = await this.prisma.enrolment.findFirst({
      where: { id: enrolmentId, cohortId, institutionId, cohort: { archivedAt: null } },
      select: cohortEnrolmentSelect,
    });

    if (!enrolment) {
      throw notFound();
    }

    if (enrolment.status === "COMPLETED") {
      throw new BadRequestException({
        code: "ENROLMENT_COMPLETED",
        message: "They have finished this pathway, so there is nothing to withdraw them from.",
      });
    }

    // Withdrawing twice is done, not an error — and keeps the date it happened.
    if (enrolment.status === "WITHDRAWN") {
      return toCohortEnrolmentView(enrolment);
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.enrolment.update({
        where: { id: enrolment.id },
        data: { status: "WITHDRAWN", withdrawnAt: new Date() },
        select: cohortEnrolmentSelect,
      });

      await audit(tx, actorId, institutionId, "enrolment.withdrawn", "Enrolment", enrolment.id, {
        cohortId,
      });

      return updated;
    });

    return toCohortEnrolmentView(row);
  }

  private async setStatus(
    actorId: string,
    institutionId: string,
    cohortId: string,
    status: CohortStatus,
    action: string,
  ): Promise<CohortSummaryView> {
    const current = await this.prisma.cohort.findFirst({
      where: { id: cohortId, institutionId, archivedAt: null },
      select: { id: true, status: true },
    });

    if (!current) {
      throw notFound();
    }

    const cohort = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.cohort.update({
        where: { id: cohortId },
        data: { status },
        select: cohortSelect,
      });

      // Doing it twice is done, not an error — and not a second event.
      if (current.status !== status) {
        await audit(tx, actorId, institutionId, action, "Cohort", cohortId);
      }

      return updated;
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
    actorId: string,
    institutionId: string,
    cohortId: string,
    input: EnrolInput,
  ): Promise<EnrolmentView> {
    const cohort = await this.prisma.cohort.findFirst({
      where: { id: cohortId, institutionId, archivedAt: null },
      select: { id: true, status: true },
    });

    if (!cohort) {
      throw notFound();
    }

    if (CLOSED_STATUSES.includes(cohort.status)) {
      throw new BadRequestException({
        code: "COHORT_CLOSED",
        message: "This intake has closed, so nobody new can be enrolled onto it.",
      });
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

    const existing = await this.prisma.enrolment.findUnique({
      where: { cohortId_userId: { cohortId, userId: membership.userId } },
      select: enrolmentSelect,
    });

    // Enrolling someone already on the cohort, or already finished, is not an
    // error — and must not touch their progress.
    if (existing && existing.status !== "WITHDRAWN") {
      return toEnrolmentView(existing);
    }

    const enrolment = await this.prisma.$transaction(async (tx) => {
      // A withdrawn enrolment is reactivated rather than replaced, so its
      // progress — which belongs to the enrolment — resumes where it stopped.
      const row = existing
        ? await tx.enrolment.update({
            where: { id: existing.id },
            data: { status: "ACTIVE", withdrawnAt: null },
            select: enrolmentSelect,
          })
        : await tx.enrolment.create({
            data: {
              cohortId,
              userId: membership.userId,
              institutionId,
              status: "ACTIVE",
            },
            select: enrolmentSelect,
          });

      await audit(
        tx,
        actorId,
        institutionId,
        existing ? "enrolment.reinstated" : "enrolment.created",
        "Enrolment",
        row.id,
        { cohortId },
      );

      return row;
    });

    return toEnrolmentView(enrolment);
  }

  /** An institution's cohorts, newest first, each with how many are enrolled. */
  async listForInstitution(institutionId: string): Promise<CohortListItemView[]> {
    const cohorts = await this.prisma.cohort.findMany({
      where: { institutionId, archivedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        ...cohortSelect,
        // Withdrawn learners are history, not part of the intake's size.
        _count: { select: { enrolments: { where: { status: { not: "WITHDRAWN" } } } } },
      },
    });

    return cohorts.map(({ _count, ...cohort }) => ({
      ...toCohortView(cohort),
      enrolmentCount: _count.enrolments,
    }));
  }

  /**
   * One cohort and the learners on it, with their real progress. Found through
   * the institution, so a cohort id from elsewhere is a 404.
   */
  async getForInstitution(institutionId: string, cohortId: string): Promise<CohortDetailView> {
    const cohort = await this.prisma.cohort.findFirst({
      where: { id: cohortId, institutionId, archivedAt: null },
      select: {
        ...cohortSelect,
        // Withdrawn learners included: the institution needs the record, and
        // a way to enrol them again.
        enrolments: {
          orderBy: { enrolledAt: "asc" },
          select: cohortEnrolmentSelect,
        },
      },
    });

    if (!cohort) {
      throw notFound();
    }

    const { enrolments, ...summary } = cohort;

    return {
      ...toCohortView(summary),
      enrolments: enrolments.map(toCohortEnrolmentView),
    };
  }

  async getMine(user: AuthenticatedUser, enrolmentId: string): Promise<EnrolmentView> {
    if (!user.institutionId) {
      throw notFound();
    }

    const row = await this.prisma.enrolment.findFirst({
      where: {
        id: enrolmentId,
        ...ownEnrolment(user.userId, user.institutionId),
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

const cohortEnrolmentSelect = {
  id: true,
  status: true,
  progressPercent: true,
  enrolledAt: true,
  withdrawnAt: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const;

type CohortEnrolmentRow = Omit<CohortEnrolmentView, "learner"> & {
  user: { id: string; firstName: string; lastName: string; email: string };
};

function toCohortEnrolmentView({ user, ...enrolment }: CohortEnrolmentRow): CohortEnrolmentView {
  return {
    ...enrolment,
    learner: {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  };
}

/** Every change an administrator makes is recorded, with who made it. */
async function audit(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  institutionId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Prisma.InputJsonValue,
): Promise<void> {
  await tx.auditEvent.create({
    data: {
      institutionId,
      actorUserId,
      action,
      entityType,
      entityId,
      ...(metadata === undefined ? {} : { metadata }),
    },
  });
}

/** A code is unique within an institution; a clash is the admin's to fix. */
function rethrowCodeTaken(error: unknown): never {
  if (isUniqueConstraintError(error)) {
    throw new ConflictException({
      code: "CODE_TAKEN",
      message: "Another cohort in this institution already uses that code.",
    });
  }

  throw error;
}

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

/** Two stored days, either of which may be unset. */
function sameDay(a: Date | null, b: Date | null): boolean {
  return a === null || b === null ? a === b : a.getTime() === b.getTime();
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
