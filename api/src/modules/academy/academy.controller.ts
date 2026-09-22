import { Controller, Get, HttpStatus, Param } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { AcademyService } from "./academy.service.js";
import type {
  LessonDetailView,
  ModuleDetailView,
  PathwayDetailView,
  PathwaySummaryView,
} from "./academy.types.js";
import {
  LessonDetailDto,
  ModuleDetailDto,
  PathwayDetailDto,
  PathwaySummaryDto,
} from "./dto/academy-response.dto.js";

const UNAUTHORIZED = { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." };
const NOT_FOUND = {
  status: HttpStatus.NOT_FOUND,
  description: "NOT_FOUND: no such slug, or it is not published.",
};

/*
  The catalogue: pathways, their modules, and the lessons inside them.

  Read-only and the same for every institution — a pathway is platform
  content, so nothing here is tenant-scoped. It still needs a session: this is
  an application, not a brochure, and lesson bodies are not public.
*/
@ApiTags("academy")
@ApiBearerAuth()
@Controller("academy")
export class AcademyController {
  constructor(private readonly academy: AcademyService) {}

  @Get("pathways")
  @CustomMessage("Pathways loaded")
  @ApiOperation({
    summary: "The published pathways",
    description: "In catalogue order. Unpublished and archived pathways never appear.",
  })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: PathwaySummaryDto, isArray: true })
  @ApiErrors(UNAUTHORIZED)
  listPathways(): Promise<PathwaySummaryView[]> {
    return this.academy.listPathways();
  }

  @Get("pathways/:pathwaySlug")
  @CustomMessage("Pathway loaded")
  @ApiOperation({ summary: "One pathway and its modules" })
  @ApiParam({ name: "pathwaySlug", example: "agricultural-entrepreneurship-foundation" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: PathwayDetailDto })
  @ApiErrors(UNAUTHORIZED, NOT_FOUND)
  getPathway(@Param("pathwaySlug") pathwaySlug: string): Promise<PathwayDetailView> {
    return this.academy.getPathway(pathwaySlug);
  }

  @Get("pathways/:pathwaySlug/modules/:moduleSlug")
  @CustomMessage("Module loaded")
  @ApiOperation({
    summary: "One module, its lessons and its assessments",
    description:
      "The module is found through its pathway, so it cannot be opened under another " +
      "pathway's slug. Assessment questions are counted, never listed.",
  })
  @ApiParam({ name: "pathwaySlug", example: "agricultural-entrepreneurship-foundation" })
  @ApiParam({ name: "moduleSlug", example: "fundamentals-of-agriculture" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: ModuleDetailDto })
  @ApiErrors(UNAUTHORIZED, NOT_FOUND)
  getModule(
    @Param("pathwaySlug") pathwaySlug: string,
    @Param("moduleSlug") moduleSlug: string,
  ): Promise<ModuleDetailView> {
    return this.academy.getModule(pathwaySlug, moduleSlug);
  }

  @Get("pathways/:pathwaySlug/modules/:moduleSlug/lessons/:lessonSlug")
  @CustomMessage("Lesson loaded")
  @ApiOperation({
    summary: "One lesson",
    description:
      "Carries the lessons either side of it, so a module can be worked through in " +
      "order. `body` is null while the lesson is an outline awaiting authoring.",
  })
  @ApiParam({ name: "pathwaySlug", example: "agricultural-entrepreneurship-foundation" })
  @ApiParam({ name: "moduleSlug", example: "fundamentals-of-agriculture" })
  @ApiParam({ name: "lessonSlug", example: "introduction" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Loaded.", type: LessonDetailDto })
  @ApiErrors(UNAUTHORIZED, NOT_FOUND)
  getLesson(
    @Param("pathwaySlug") pathwaySlug: string,
    @Param("moduleSlug") moduleSlug: string,
    @Param("lessonSlug") lessonSlug: string,
  ): Promise<LessonDetailView> {
    return this.academy.getLesson(pathwaySlug, moduleSlug, lessonSlug);
  }
}
