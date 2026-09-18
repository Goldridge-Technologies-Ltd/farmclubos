import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength,
} from "class-validator";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../password.constants.js";

/** Opaque tokens are 43 characters; the bounds only reject obvious garbage. */
const TOKEN_LENGTH = { min: 20, max: 200 } as const;

export class LoginDto {
  @ApiProperty({ example: "ada.obi@example.com" })
  @IsEmail()
  @MaxLength(254)
  email: string;

  /*
    Not held to the current minimum: a password set under an older policy must
    still sign in.
  */
  @ApiProperty({ example: "correct horse battery staple" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: "The refresh token from sign-in or the last refresh." })
  @IsString()
  @Length(TOKEN_LENGTH.min, TOKEN_LENGTH.max)
  refreshToken: string;
}

export class SwitchInstitutionDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  institutionId: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: "ada.obi@example.com" })
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: "The token from the reset link." })
  @IsString()
  @Length(TOKEN_LENGTH.min, TOKEN_LENGTH.max)
  token: string;

  @ApiProperty({
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    example: "a long new passphrase",
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}
