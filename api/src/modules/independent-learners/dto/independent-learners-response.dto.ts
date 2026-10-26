import { ApiProperty } from "@nestjs/swagger";
import { EnrolmentStatus } from "../../../generated/prisma/enums.js";
import { SwitchedInstitutionDto } from "../../auth/dto/auth-response.dto.js";
import type { StartedPathwayView } from "../independent-learners.types.js";

export class StartedPathwayDto implements StartedPathwayView {
  @ApiProperty({ format: "uuid" })
  enrolmentId: string;

  @ApiProperty({
    enum: EnrolmentStatus,
    enumName: "EnrolmentStatus",
    description: "ACTIVE, or COMPLETED for a pathway already finished.",
  })
  status: EnrolmentStatus;

  @ApiProperty({
    type: () => SwitchedInstitutionDto,
    nullable: true,
    description:
      "A fresh access token when the session moved to independent learning, where the " +
      "progress is recorded; null when it was there already.",
  })
  session: SwitchedInstitutionDto | null;
}
