import { ApiProperty } from "@nestjs/swagger";
import {
  AssessmentKind,
  AuthoringStatus,
  LessonKind,
  PathwayLevel,
} from "../../../generated/prisma/enums.js";
import type {
  AssessmentSummaryView,
  LessonDetailView,
  LessonLinkView,
  LessonSummaryView,
  ModuleDetailView,
  ModuleSummaryView,
  PathwayDetailView,
  PathwayRefView,
  PathwaySummaryView,
} from "../academy.types.js";

/*
  The catalogue's response shapes, for Swagger.

  Every count here is a real row count. `estimatedHours` and
  `durationMinutes` are deliberately absent from the summaries and null in
  practice: they are seeded nowhere, because a figure that is not real must
  never reach a screen (AGENTS.md).
*/

export class PathwayRefDto implements PathwayRefView {
  @ApiProperty({ example: "agricultural-entrepreneurship-foundation" })
  slug: string;

  @ApiProperty({ example: "Agricultural Entrepreneurship Foundation" })
  title: string;
}

export class PathwaySummaryDto implements PathwaySummaryView {
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

  @ApiProperty({ description: "Where this pathway sits in the catalogue." })
  sequence: number;

  @ApiProperty({ description: "Published modules only." })
  moduleCount: number;
}

export class ModuleSummaryDto implements ModuleSummaryView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "fundamentals-of-agriculture" })
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: String, nullable: true })
  summary: string | null;

  @ApiProperty()
  sequence: number;

  @ApiProperty({ description: "Published lessons only." })
  lessonCount: number;

  @ApiProperty({ description: "Published assessments only." })
  assessmentCount: number;
}

export class PathwayDetailDto extends PathwaySummaryDto implements PathwayDetailView {
  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: [ModuleSummaryDto] })
  modules: ModuleSummaryDto[];
}

export class LessonSummaryDto implements LessonSummaryView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "introduction" })
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: String, nullable: true })
  summary: string | null;

  @ApiProperty({ enum: LessonKind, enumName: "LessonKind" })
  kind: LessonKind;

  @ApiProperty({
    enum: AuthoringStatus,
    enumName: "AuthoringStatus",
    description: "PLACEHOLDER means the outline exists and the lesson is unwritten.",
  })
  authoringStatus: AuthoringStatus;

  @ApiProperty({ type: Number, nullable: true, description: "Null until authored." })
  durationMinutes: number | null;

  @ApiProperty()
  sequence: number;
}

export class AssessmentSummaryDto implements AssessmentSummaryView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "module-quiz" })
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: AssessmentKind, enumName: "AssessmentKind" })
  kind: AssessmentKind;

  @ApiProperty({ enum: AuthoringStatus, enumName: "AuthoringStatus" })
  authoringStatus: AuthoringStatus;

  @ApiProperty()
  passMarkPercent: number;

  @ApiProperty({ description: "Questions are counted here, never listed." })
  questionCount: number;
}

export class ModuleDetailDto extends ModuleSummaryDto implements ModuleDetailView {
  @ApiProperty({ type: PathwayRefDto })
  pathway: PathwayRefDto;

  @ApiProperty({ type: [LessonSummaryDto] })
  lessons: LessonSummaryDto[];

  @ApiProperty({ type: [AssessmentSummaryDto] })
  assessments: AssessmentSummaryDto[];
}

export class LessonLinkDto implements LessonLinkView {
  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;
}

export class LessonDetailDto extends LessonSummaryDto implements LessonDetailView {
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Null while the lesson is an outline awaiting authoring.",
  })
  body: string | null;

  @ApiProperty({ type: PathwayRefDto })
  pathway: PathwayRefDto;

  @ApiProperty({ type: PathwayRefDto })
  module: PathwayRefDto;

  @ApiProperty({ type: LessonLinkDto, nullable: true })
  previous: LessonLinkDto | null;

  @ApiProperty({ type: LessonLinkDto, nullable: true })
  next: LessonLinkDto | null;
}
