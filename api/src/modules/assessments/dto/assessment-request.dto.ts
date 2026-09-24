import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class AnswerDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  questionId: string;

  @ApiPropertyOptional({ type: [String], format: "uuid" })
  @IsOptional()
  @IsArray()
  // A question cannot have more options than this; a longer list is noise.
  @ArrayMaxSize(20)
  @IsUUID(undefined, { each: true })
  selectedOptionIds?: string[];

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  textAnswer?: string | null;
}

export class SaveAnswersDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
