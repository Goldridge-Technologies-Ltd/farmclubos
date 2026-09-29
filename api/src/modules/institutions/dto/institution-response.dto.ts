import { ApiProperty } from "@nestjs/swagger";
import { InstitutionStatus, InstitutionType, InstitutionRole } from "../../../generated/prisma/enums.js";
import type { InstitutionView, MemberView, RemovedMemberView } from "../institutions.types.js";

export class InstitutionDto implements InstitutionView {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "greenfield-technical-college" })
  slug: string;

  @ApiProperty({ example: "Greenfield Technical College" })
  name: string;

  @ApiProperty({ enum: InstitutionType, enumName: "InstitutionType" })
  type: InstitutionType;

  @ApiProperty({ enum: InstitutionStatus, enumName: "InstitutionStatus" })
  status: InstitutionStatus;

  @ApiProperty({ example: "office@greenfield.example.com" })
  contactEmail: string;

  @ApiProperty({ type: String, nullable: true })
  contactPhone: string | null;

  @ApiProperty({ type: String, nullable: true })
  website: string | null;

  @ApiProperty({ type: String, nullable: true })
  addressLine: string | null;

  @ApiProperty({ type: String, nullable: true })
  city: string | null;

  @ApiProperty({ type: String, nullable: true })
  country: string | null;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt: Date;
}

export class MemberDto implements MemberView {
  @ApiProperty({ format: "uuid" })
  userId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: InstitutionRole, enumName: "InstitutionRole" })
  role: InstitutionRole;

  @ApiProperty({ type: Date, nullable: true, format: "date-time" })
  joinedAt: Date | null;

  @ApiProperty({ description: "Their open cohort places here — what removing them withdraws." })
  openEnrolments: number;
}

export class RemovedMemberDto implements RemovedMemberView {
  @ApiProperty({ format: "uuid" })
  userId: string;

  @ApiProperty({ description: "Open cohort places withdrawn with them." })
  enrolmentsWithdrawn: number;
}
