import { ApiProperty } from "@nestjs/swagger";
import {
  AssessmentKind,
  AttemptStatus,
  AuthoringStatus,
  QuestionType,
} from "../../../generated/prisma/enums.js";
import type {
  AssessmentOptionView,
  AssessmentQuestionView,
  AssessmentView,
  AttemptResponseView,
  AttemptView,
} from "../assessments.types.js";

/*
  Note what is absent: no DTO here has an `isCorrect` on an *option*. A
  learner is told whether their own answer was right, never which answer was.
*/

export class AssessmentOptionDto implements AssessmentOptionView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  sequence: number;
}

export class AssessmentQuestionDto implements AssessmentQuestionView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  prompt: string;

  @ApiProperty({ type: String, nullable: true })
  helpText: string | null;

  @ApiProperty({ enum: QuestionType, enumName: "QuestionType" })
  type: QuestionType;

  @ApiProperty()
  points: number;

  @ApiProperty()
  sequence: number;

  @ApiProperty({ type: [AssessmentOptionDto], description: "Empty for a written answer." })
  options: AssessmentOptionDto[];
}

class AssessmentRefDto {
  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;
}

export class AssessmentDto implements AssessmentView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: String, nullable: true })
  instructions: string | null;

  @ApiProperty({ enum: AssessmentKind, enumName: "AssessmentKind" })
  kind: AssessmentKind;

  @ApiProperty({ enum: AuthoringStatus, enumName: "AuthoringStatus" })
  authoringStatus: AuthoringStatus;

  @ApiProperty()
  passMarkPercent: number;

  @ApiProperty({ type: Number, nullable: true, description: "Null means no limit." })
  maxAttempts: number | null;

  @ApiProperty({ type: Number, nullable: true })
  timeLimitMinutes: number | null;

  @ApiProperty({ type: AssessmentRefDto })
  pathway: AssessmentRefDto;

  @ApiProperty({ type: AssessmentRefDto })
  module: AssessmentRefDto;

  @ApiProperty({ type: [AssessmentQuestionDto] })
  questions: AssessmentQuestionDto[];

  @ApiProperty({ description: "Your own attempts, counted." })
  attemptsUsed: number;

  @ApiProperty()
  canAttempt: boolean;
}

export class AttemptResponseDto implements AttemptResponseView {
  @ApiProperty({ format: "uuid" })
  questionId: string;

  @ApiProperty({ type: [String], format: "uuid" })
  selectedOptionIds: string[];

  @ApiProperty({ type: String, nullable: true })
  textAnswer: string | null;

  @ApiProperty({
    type: Boolean,
    nullable: true,
    description: "Null until graded, and for a written answer a person must mark.",
  })
  isCorrect: boolean | null;

  @ApiProperty({ type: Number, nullable: true })
  pointsAwarded: number | null;
}

export class AttemptDto implements AttemptView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ format: "uuid" })
  assessmentId: string;

  @ApiProperty()
  attemptNumber: number;

  @ApiProperty({ enum: AttemptStatus, enumName: "AttemptStatus" })
  status: AttemptStatus;

  @ApiProperty({ format: "date-time" })
  startedAt: Date;

  @ApiProperty({ type: Date, nullable: true, format: "date-time" })
  submittedAt: Date | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: "Out of the points that could be graded automatically.",
  })
  scorePercent: number | null;

  @ApiProperty({ type: Boolean, nullable: true })
  passed: boolean | null;

  @ApiProperty({ description: "Written answers left for a person to mark." })
  questionsAwaitingReview: number;

  @ApiProperty({ type: [AttemptResponseDto] })
  responses: AttemptResponseDto[];
}
