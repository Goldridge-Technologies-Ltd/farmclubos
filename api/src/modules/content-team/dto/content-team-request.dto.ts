import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MaxLength } from "class-validator";
import { Trim } from "../../../common/decorators/trim.decorator.js";

export class InviteContentManagerDto {
  @ApiProperty({ example: "maker@example.com" })
  @Trim()
  @IsEmail()
  @MaxLength(254)
  email: string;
}
