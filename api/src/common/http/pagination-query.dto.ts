import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

/** `?page=&pageSize=` for any list route. Extend it to add filters. */
export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}

/** The Prisma `skip`/`take` for a page. */
export function pageWindow({ page, pageSize }: PaginationQueryDto): {
  skip: number;
  take: number;
} {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
