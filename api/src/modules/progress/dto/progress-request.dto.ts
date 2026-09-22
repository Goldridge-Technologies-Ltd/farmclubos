import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CompleteLessonDto {
  @ApiProperty({ format: "uuid", description: "The lesson being marked complete." })
  @IsUUID()
  lessonId: string;
}
