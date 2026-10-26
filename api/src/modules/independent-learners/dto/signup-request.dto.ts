import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MaxLength } from "class-validator";

export class SignupDto {
  @ApiProperty({ example: "ada.obi@example.com" })
  @IsEmail()
  @MaxLength(254)
  email: string;
}
