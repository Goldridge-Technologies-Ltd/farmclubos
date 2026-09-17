import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { PaginationMeta, ResponseMeta } from "./api-response.js";

/*
  Swagger classes for the response envelope. They implement the types in
  api-response.ts, so the documentation cannot drift from the real shape.
*/

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;

  @ApiProperty({ example: 42 })
  totalItems: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class ResponseMetaDto implements ResponseMeta {
  @ApiProperty({ example: "0192f1c4-7b2e-7d3a-9c1e-5b8a2f4e6d10" })
  requestId: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: "2026-09-17T10:00:00.000Z" })
  timestamp: string;

  @ApiPropertyOptional({ type: () => PaginationMetaDto })
  pagination?: PaginationMetaDto;
}

export class ApiErrorDto {
  @ApiProperty({ example: "NOT_FOUND" })
  code: string;

  @ApiProperty({ example: "Institution not found." })
  message: string;

  @ApiPropertyOptional({
    type: [String],
    example: ["email must be an email"],
    description: "Present when the request failed validation.",
  })
  details?: string[];
}
