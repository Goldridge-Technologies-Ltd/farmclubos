import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class CompleteLessonDto {
  @ApiProperty({ format: "uuid", description: "The lesson being marked complete." })
  @IsUUID()
  lessonId: string;
}

export class CompleteSceneDto {
  @ApiProperty({ format: "uuid", description: "The scene the learner has just finished." })
  @IsUUID()
  sceneId: string;
}
