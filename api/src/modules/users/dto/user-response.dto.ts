import { ApiProperty } from "@nestjs/swagger";
import {
  EducationLevel,
  EmploymentStatus,
  Gender,
  PlatformRole,
  UserState,
} from "../../../generated/prisma/enums.js";
import type { LearnerProfileView, ProfileView } from "../users.types.js";

export class LearnerProfileDto implements LearnerProfileView {
  @ApiProperty({ enum: UserState, enumName: "UserState", description: "Set by the institution." })
  state: UserState;

  @ApiProperty({ type: String, nullable: true })
  phone: string | null;

  @ApiProperty({ type: String, nullable: true, format: "date", example: "2004-03-09" })
  dateOfBirth: string | null;

  @ApiProperty({ enum: Gender, enumName: "Gender", nullable: true })
  gender: Gender | null;

  @ApiProperty({ enum: EducationLevel, enumName: "EducationLevel", nullable: true })
  educationLevel: EducationLevel | null;

  @ApiProperty({ enum: EmploymentStatus, enumName: "EmploymentStatus", nullable: true })
  employmentStatus: EmploymentStatus | null;

  @ApiProperty({ type: String, nullable: true })
  location: string | null;

  @ApiProperty({ type: String, nullable: true })
  bio: string | null;

  @ApiProperty({ type: String, nullable: true })
  goals: string | null;
}

export class ProfileDto implements ProfileView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "tunde@example.com" })
  email: string;

  @ApiProperty({ example: "Tunde" })
  firstName: string;

  @ApiProperty({ example: "Bello" })
  lastName: string;

  @ApiProperty({ enum: PlatformRole, enumName: "PlatformRole" })
  platformRole: PlatformRole;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  emailVerifiedAt: Date | null;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt: Date;

  @ApiProperty({ type: () => LearnerProfileDto, nullable: true, description: "Null for staff." })
  learnerProfile: LearnerProfileDto | null;
}
