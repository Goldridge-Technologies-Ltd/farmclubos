import { ApiProperty } from "@nestjs/swagger";
import {
  AuthoringStatus,
  LessonKind,
  LessonSceneKind,
  PublishStatus,
} from "../../../generated/prisma/enums.js";
import type { SceneGap } from "../../academy/scene-readiness.js";
import type {
  AuthoringLessonSummaryView,
  AuthoringLessonView,
  AuthoringModuleSummaryView,
  AuthoringModuleView,
  AuthoringPathwaySummaryView,
  AuthoringPathwayView,
  AuthoringSceneSummaryView,
  PathwayRefView,
} from "../authoring.types.js";

export class PathwayRefDto implements PathwayRefView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "agricultural-entrepreneurship-foundation" })
  slug: string;

  @ApiProperty()
  title: string;
}

export class AuthoringPathwaySummaryDto implements AuthoringPathwaySummaryView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: PublishStatus, enumName: "PublishStatus" })
  status: PublishStatus;

  @ApiProperty({ description: "Modules not archived." })
  moduleCount: number;

  @ApiProperty()
  publishedModuleCount: number;
}

export class AuthoringModuleSummaryDto implements AuthoringModuleSummaryView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ description: "Follows the title until first published, then fixed." })
  slug: string;

  @ApiProperty({ example: "Enterprise Mindset" })
  title: string;

  @ApiProperty({ type: String, nullable: true })
  summary: string | null;

  @ApiProperty()
  sequence: number;

  @ApiProperty({ enum: PublishStatus, enumName: "PublishStatus" })
  status: PublishStatus;

  @ApiProperty({ type: Date, nullable: true, description: "When it was first published." })
  publishedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  archivedAt: Date | null;

  @ApiProperty({ description: "Lessons not archived." })
  lessonCount: number;

  @ApiProperty()
  publishedLessonCount: number;
}

export class AuthoringPathwayDto extends AuthoringPathwaySummaryDto implements AuthoringPathwayView {
  @ApiProperty()
  summary: string;

  @ApiProperty({ type: [AuthoringModuleSummaryDto], description: "Archived ones included." })
  modules: AuthoringModuleSummaryDto[];
}

export class AuthoringLessonSummaryDto implements AuthoringLessonSummaryView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: String, nullable: true })
  summary: string | null;

  @ApiProperty()
  sequence: number;

  @ApiProperty({ enum: PublishStatus, enumName: "PublishStatus" })
  status: PublishStatus;

  @ApiProperty({ type: Date, nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  archivedAt: Date | null;

  @ApiProperty({ enum: LessonKind, enumName: "LessonKind" })
  kind: LessonKind;

  @ApiProperty({ enum: AuthoringStatus, enumName: "AuthoringStatus" })
  authoringStatus: AuthoringStatus;

  @ApiProperty()
  sceneCount: number;

  @ApiProperty({ description: "Scenes with nothing missing: what a learner would see." })
  readySceneCount: number;
}

export class AuthoringModuleDto extends AuthoringModuleSummaryDto implements AuthoringModuleView {
  @ApiProperty({ type: PathwayRefDto })
  pathway: PathwayRefDto;

  @ApiProperty({ type: [AuthoringLessonSummaryDto], description: "Archived ones included." })
  lessons: AuthoringLessonSummaryDto[];
}

export class AuthoringSceneSummaryDto implements AuthoringSceneSummaryView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ enum: LessonSceneKind, enumName: "LessonSceneKind" })
  kind: LessonSceneKind;

  @ApiProperty()
  sequence: number;

  @ApiProperty()
  title: string;

  @ApiProperty({
    enum: ["VIDEO", "POSTER", "BODY"],
    isArray: true,
    description: "What it still needs before learners see it. Empty when complete.",
  })
  gaps: SceneGap[];
}

class AuthoringLessonModuleDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: PublishStatus, enumName: "PublishStatus" })
  status: PublishStatus;
}

export class AuthoringLessonDto extends AuthoringLessonSummaryDto implements AuthoringLessonView {
  @ApiProperty({ type: AuthoringLessonModuleDto })
  module: AuthoringLessonModuleDto;

  @ApiProperty({ type: PathwayRefDto })
  pathway: PathwayRefDto;

  @ApiProperty({ type: [AuthoringSceneSummaryDto] })
  scenes: AuthoringSceneSummaryDto[];
}
