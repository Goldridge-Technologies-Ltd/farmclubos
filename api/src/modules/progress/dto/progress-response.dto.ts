import { ApiProperty } from "@nestjs/swagger";
import {
  CohortStatus,
  EnrolmentStatus,
  ProgressStatus,
} from "../../../generated/prisma/enums.js";
import type {
  JourneyView,
  LessonCompletionView,
  LessonProgressView,
  ModuleProgressView,
} from "../progress.types.js";

export class LessonProgressDto implements LessonProgressView {
  @ApiProperty({ format: "uuid" })
  lessonId: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ProgressStatus, enumName: "ProgressStatus" })
  status: ProgressStatus;

  @ApiProperty({ type: Date, nullable: true, format: "date-time" })
  completedAt: Date | null;
}

export class ModuleProgressDto implements ModuleProgressView {
  @ApiProperty({ format: "uuid" })
  moduleId: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  sequence: number;

  @ApiProperty({ enum: ProgressStatus, enumName: "ProgressStatus" })
  status: ProgressStatus;

  @ApiProperty({ description: "Counted from rows, never estimated." })
  lessonsCompleted: number;

  @ApiProperty({ description: "Published lessons in this module." })
  lessonCount: number;

  @ApiProperty({ type: [LessonProgressDto] })
  lessons: LessonProgressDto[];
}

class JourneyCohortDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: CohortStatus,
    enumName: "CohortStatus",
    description: "COMPLETED or CANCELLED: closed to new learners, but open to finish.",
  })
  status: CohortStatus;
}

class JourneyPathwayDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;
}

export class JourneyDto implements JourneyView {
  @ApiProperty({ format: "uuid" })
  enrolmentId: string;

  @ApiProperty({ enum: EnrolmentStatus, enumName: "EnrolmentStatus" })
  status: EnrolmentStatus;

  @ApiProperty({ description: "Recomputed from completed lessons on every write." })
  progressPercent: number;

  @ApiProperty({ type: JourneyCohortDto })
  cohort: JourneyCohortDto;

  @ApiProperty({ type: JourneyPathwayDto })
  pathway: JourneyPathwayDto;

  @ApiProperty({ type: [ModuleProgressDto] })
  modules: ModuleProgressDto[];
}

export class LessonCompletionDto implements LessonCompletionView {
  @ApiProperty({ format: "uuid" })
  lessonId: string;

  @ApiProperty({ enum: ProgressStatus, enumName: "ProgressStatus" })
  status: ProgressStatus;

  @ApiProperty({ type: Date, nullable: true, format: "date-time" })
  completedAt: Date | null;

  @ApiProperty({ enum: ProgressStatus, enumName: "ProgressStatus" })
  moduleStatus: ProgressStatus;

  @ApiProperty()
  progressPercent: number;
}
