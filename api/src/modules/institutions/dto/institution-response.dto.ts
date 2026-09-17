import { ApiProperty } from "@nestjs/swagger";
import { InstitutionStatus, InstitutionType } from "../../../generated/prisma/enums.js";
import type { InstitutionView } from "../institutions.types.js";

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
