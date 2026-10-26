import { ApiProperty } from "@nestjs/swagger";
import {
  CohortStatus,
  DeliveryMode,
  EnrolmentStatus,
  PathwayLevel,
} from "../../../generated/prisma/enums.js";
import type {
  CohortDetailView,
  CohortEnrolmentView,
  CohortListItemView,
  CohortPathwayView,
  CohortSummaryView,
  EnrolmentView,
} from "../cohorts.types.js";

export class CohortPathwayDto implements CohortPathwayView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "agricultural-entrepreneurship-foundation" })
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  summary: string;

  @ApiProperty({ enum: PathwayLevel, enumName: "PathwayLevel" })
  level: PathwayLevel;
}

export class CohortSummaryDto implements CohortSummaryView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "September intake" })
  name: string;

  @ApiProperty({ type: String, nullable: true, description: "The institution's own code." })
  code: string | null;

  @ApiProperty({ enum: CohortStatus, enumName: "CohortStatus" })
  status: CohortStatus;

  @ApiProperty({ enum: DeliveryMode, enumName: "DeliveryMode" })
  deliveryMode: DeliveryMode;

  @ApiProperty({ type: String, nullable: true, format: "date", example: "2026-09-01" })
  startsOn: string | null;

  @ApiProperty({ type: String, nullable: true, format: "date" })
  endsOn: string | null;

  @ApiProperty({
    description:
      "The always-open cohort independent learners join by starting the pathway themselves.",
  })
  selfPaced: boolean;

  @ApiProperty({ type: CohortPathwayDto })
  pathway: CohortPathwayDto;
}

export class EnrolmentDto implements EnrolmentView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ enum: EnrolmentStatus, enumName: "EnrolmentStatus" })
  status: EnrolmentStatus;

  @ApiProperty({ description: "Derived from completed lessons. Never illustrative." })
  progressPercent: number;

  @ApiProperty({ format: "date-time" })
  enrolledAt: Date;

  @ApiProperty({ type: Date, nullable: true, format: "date-time" })
  startedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true, format: "date-time" })
  completedAt: Date | null;

  @ApiProperty({ type: CohortSummaryDto })
  cohort: CohortSummaryDto;
}

export class CohortListItemDto extends CohortSummaryDto implements CohortListItemView {
  @ApiProperty({ description: "Learners on the cohort, withdrawn ones excluded." })
  enrolmentCount: number;
}

class CohortLearnerDto {
  @ApiProperty({ format: "uuid" })
  userId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;
}

export class CohortEnrolmentDto implements CohortEnrolmentView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ enum: EnrolmentStatus, enumName: "EnrolmentStatus" })
  status: EnrolmentStatus;

  @ApiProperty({ description: "Derived from completed lessons. Never illustrative." })
  progressPercent: number;

  @ApiProperty({ format: "date-time" })
  enrolledAt: Date;

  @ApiProperty({
    type: Date,
    nullable: true,
    format: "date-time",
    description: "Set while withdrawn; cleared when enrolled again.",
  })
  withdrawnAt: Date | null;

  @ApiProperty({ type: CohortLearnerDto })
  learner: CohortLearnerDto;
}

export class CohortDetailDto extends CohortSummaryDto implements CohortDetailView {
  @ApiProperty({ type: [CohortEnrolmentDto] })
  enrolments: CohortEnrolmentDto[];
}
