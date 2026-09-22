import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PrismaService } from "../../lib/database/prisma.service.js";
import type { CohortSummaryView, EnrolmentView } from "./cohorts.types.js";

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
