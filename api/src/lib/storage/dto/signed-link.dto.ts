import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsString, Min, MinLength } from "class-validator";

/** The query a local storage link carries, as the API signed it. */
export class SignedLinkDto {
  @ApiProperty({ description: "When the link stops working, in seconds since 1970." })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expires: number;

  @ApiProperty({ description: "The link's signature." })
  @IsString()
  @MinLength(1)
  signature: string;
}
