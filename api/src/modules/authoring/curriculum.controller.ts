import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { ApiEnvelope, ApiErrors } from "../../common/decorators/api-envelope.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { CustomMessage } from "../../common/decorators/custom-message.decorator.js";
import { PlatformRoles } from "../../common/decorators/roles.decorator.js";
import type {
  AuthoringLessonSummaryView,
  AuthoringLessonView,
  AuthoringModuleSummaryView,
  AuthoringModuleView,
  AuthoringPathwaySummaryView,
  AuthoringPathwayView,
} from "./authoring.types.js";
import { CurriculumService } from "./curriculum.service.js";
import {
  CreateCurriculumItemDto,
  MoveDto,
  UpdateCurriculumItemDto,
} from "./dto/curriculum-request.dto.js";
import {
  AuthoringLessonDto,
  AuthoringLessonSummaryDto,
  AuthoringModuleDto,
  AuthoringModuleSummaryDto,
  AuthoringPathwayDto,
  AuthoringPathwaySummaryDto,
} from "./dto/curriculum-response.dto.js";

const UNAUTHORIZED = { status: HttpStatus.UNAUTHORIZED, description: "No valid access token." };
const FORBIDDEN = {
  status: HttpStatus.FORBIDDEN,
  description: "INSUFFICIENT_ROLE: only platform administrators and content managers.",
};
const NOT_FOUND = { status: HttpStatus.NOT_FOUND, description: "NOT_FOUND." };
const VALIDATION = { status: HttpStatus.BAD_REQUEST, description: "VALIDATION_FAILED." };
const SLUG_TAKEN = {
  status: HttpStatus.CONFLICT,
  description: "SLUG_TAKEN: a sibling was given the same name at the same moment.",
};

/*
  The content team's side of the Academy: modules and lessons below each
  pathway, drafts and archived items included.

  The platform roles here are coarse; ContentAccessService checks the role
  against the database on every call, so taking someone off the content team
  takes effect at once.
*/
@ApiTags("authoring")
@ApiBearerAuth()
@PlatformRoles("PLATFORM_ADMIN", "CONTENT_MANAGER")
@Controller("authoring")
export class CurriculumController {
  constructor(private readonly curriculum: CurriculumService) {}

  // ─── Pathways ─────────────────────────────────────────────────────────────

  @Get("pathways")
  @CustomMessage("Pathways loaded")
  @ApiOperation({ summary: "Every pathway, with how many modules it has and has published" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Pathways.", type: AuthoringPathwaySummaryDto, isArray: true })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN)
  listPathways(@CurrentUser() user: AuthenticatedUser): Promise<AuthoringPathwaySummaryView[]> {
    return this.curriculum.listPathways(user);
  }

  @Get("pathways/:pathwayId")
  @CustomMessage("Pathway loaded")
  @ApiOperation({ summary: "A pathway and all of its modules, drafts and archived included" })
  @ApiParam({ name: "pathwayId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "The pathway.", type: AuthoringPathwayDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  getPathway(
    @CurrentUser() user: AuthenticatedUser,
    @Param("pathwayId", ParseUUIDPipe) pathwayId: string,
  ): Promise<AuthoringPathwayView> {
    return this.curriculum.getPathway(user, pathwayId);
  }

  // ─── Modules ──────────────────────────────────────────────────────────────

  @Post("pathways/:pathwayId/modules")
  @CustomMessage("Module added")
  @ApiOperation({
    summary: "Add a module to a pathway",
    description: "It is added at the end, as a draft, with a slug made from its title.",
  })
  @ApiParam({ name: "pathwayId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.CREATED, description: "Added.", type: AuthoringModuleSummaryDto })
  @ApiErrors(VALIDATION, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SLUG_TAKEN)
  createModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("pathwayId", ParseUUIDPipe) pathwayId: string,
    @Body() body: CreateCurriculumItemDto,
  ): Promise<AuthoringModuleSummaryView> {
    return this.curriculum.createModule(user, pathwayId, body);
  }

  @Get("modules/:moduleId")
  @CustomMessage("Module loaded")
  @ApiOperation({ summary: "A module and all of its lessons, drafts and archived included" })
  @ApiParam({ name: "moduleId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "The module.", type: AuthoringModuleDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  getModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
  ): Promise<AuthoringModuleView> {
    return this.curriculum.getModule(user, moduleId);
  }

  @Patch("modules/:moduleId")
  @CustomMessage("Module updated")
  @ApiOperation({
    summary: "Rename a module or change its summary",
    description: "Its slug follows a new title only until the module is first published.",
  })
  @ApiParam({ name: "moduleId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Updated.", type: AuthoringModuleSummaryDto })
  @ApiErrors(VALIDATION, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SLUG_TAKEN)
  updateModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Body() body: UpdateCurriculumItemDto,
  ): Promise<AuthoringModuleSummaryView> {
    return this.curriculum.updateModule(user, moduleId, body);
  }

  @Post("modules/:moduleId/move")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Module moved")
  @ApiOperation({ summary: "Move a module up or down its pathway" })
  @ApiParam({ name: "moduleId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Moved.", type: AuthoringModuleSummaryDto })
  @ApiErrors(VALIDATION, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  moveModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Body() body: MoveDto,
  ): Promise<AuthoringModuleSummaryView> {
    return this.curriculum.moveModule(user, moduleId, body.direction);
  }

  @Post("modules/:moduleId/publish")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Module published")
  @ApiOperation({
    summary: "Publish a module",
    description: "It needs at least one published lesson. Recalculates learners' progress.",
  })
  @ApiParam({ name: "moduleId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Published.", type: AuthoringModuleSummaryDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "MODULE_EMPTY or ARCHIVED." },
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
  )
  publishModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
  ): Promise<AuthoringModuleSummaryView> {
    return this.curriculum.publishModule(user, moduleId);
  }

  @Post("modules/:moduleId/unpublish")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Module unpublished")
  @ApiOperation({ summary: "Take a module back to draft, hiding it and its lessons from learners" })
  @ApiParam({ name: "moduleId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Unpublished.", type: AuthoringModuleSummaryDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  unpublishModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
  ): Promise<AuthoringModuleSummaryView> {
    return this.curriculum.unpublishModule(user, moduleId);
  }

  @Post("modules/:moduleId/archive")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Module archived")
  @ApiOperation({
    summary: "Archive a module",
    description: "Hidden from learners and returned to draft; never deleted, since progress hangs off it.",
  })
  @ApiParam({ name: "moduleId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Archived.", type: AuthoringModuleSummaryDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  archiveModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
  ): Promise<AuthoringModuleSummaryView> {
    return this.curriculum.archiveModule(user, moduleId);
  }

  @Post("modules/:moduleId/restore")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Module restored")
  @ApiOperation({ summary: "Restore an archived module, as a draft at the end of its pathway" })
  @ApiParam({ name: "moduleId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Restored.", type: AuthoringModuleSummaryDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  restoreModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
  ): Promise<AuthoringModuleSummaryView> {
    return this.curriculum.restoreModule(user, moduleId);
  }

  // ─── Lessons ──────────────────────────────────────────────────────────────

  @Post("modules/:moduleId/lessons")
  @CustomMessage("Lesson added")
  @ApiOperation({
    summary: "Add a lesson to a module",
    description: "It is added at the end, as a draft with no scenes yet.",
  })
  @ApiParam({ name: "moduleId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.CREATED, description: "Added.", type: AuthoringLessonSummaryDto })
  @ApiErrors(VALIDATION, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SLUG_TAKEN)
  createLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("moduleId", ParseUUIDPipe) moduleId: string,
    @Body() body: CreateCurriculumItemDto,
  ): Promise<AuthoringLessonSummaryView> {
    return this.curriculum.createLesson(user, moduleId, body);
  }

  @Get("lessons/:lessonId")
  @CustomMessage("Lesson loaded")
  @ApiOperation({ summary: "A lesson and its scenes, each with what it still needs" })
  @ApiParam({ name: "lessonId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "The lesson.", type: AuthoringLessonDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  getLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
  ): Promise<AuthoringLessonView> {
    return this.curriculum.getLesson(user, lessonId);
  }

  @Patch("lessons/:lessonId")
  @CustomMessage("Lesson updated")
  @ApiOperation({
    summary: "Rename a lesson or change its summary",
    description: "Its slug follows a new title only until the lesson is first published.",
  })
  @ApiParam({ name: "lessonId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Updated.", type: AuthoringLessonSummaryDto })
  @ApiErrors(VALIDATION, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SLUG_TAKEN)
  updateLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Body() body: UpdateCurriculumItemDto,
  ): Promise<AuthoringLessonSummaryView> {
    return this.curriculum.updateLesson(user, lessonId, body);
  }

  @Post("lessons/:lessonId/move")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Lesson moved")
  @ApiOperation({ summary: "Move a lesson up or down its module" })
  @ApiParam({ name: "lessonId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Moved.", type: AuthoringLessonSummaryDto })
  @ApiErrors(VALIDATION, UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  moveLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Body() body: MoveDto,
  ): Promise<AuthoringLessonSummaryView> {
    return this.curriculum.moveLesson(user, lessonId, body.direction);
  }

  @Post("lessons/:lessonId/publish")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Lesson published")
  @ApiOperation({
    summary: "Publish a lesson",
    description:
      "Every scene must be complete: a video with its still image (captions are optional), " +
      "or notes with text. Recalculates learners' progress.",
  })
  @ApiParam({ name: "lessonId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Published.", type: AuthoringLessonSummaryDto })
  @ApiErrors(
    { status: HttpStatus.BAD_REQUEST, description: "LESSON_EMPTY, LESSON_INCOMPLETE or ARCHIVED." },
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
  )
  publishLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
  ): Promise<AuthoringLessonSummaryView> {
    return this.curriculum.publishLesson(user, lessonId);
  }

  @Post("lessons/:lessonId/unpublish")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Lesson unpublished")
  @ApiOperation({ summary: "Take a lesson back to draft, hiding it from learners" })
  @ApiParam({ name: "lessonId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Unpublished.", type: AuthoringLessonSummaryDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  unpublishLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
  ): Promise<AuthoringLessonSummaryView> {
    return this.curriculum.unpublishLesson(user, lessonId);
  }

  @Post("lessons/:lessonId/archive")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Lesson archived")
  @ApiOperation({
    summary: "Archive a lesson",
    description: "Hidden from learners and returned to draft; never deleted, since progress hangs off it.",
  })
  @ApiParam({ name: "lessonId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Archived.", type: AuthoringLessonSummaryDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  archiveLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
  ): Promise<AuthoringLessonSummaryView> {
    return this.curriculum.archiveLesson(user, lessonId);
  }

  @Post("lessons/:lessonId/restore")
  @HttpCode(HttpStatus.OK)
  @CustomMessage("Lesson restored")
  @ApiOperation({ summary: "Restore an archived lesson, as a draft at the end of its module" })
  @ApiParam({ name: "lessonId", format: "uuid" })
  @ApiEnvelope({ status: HttpStatus.OK, description: "Restored.", type: AuthoringLessonSummaryDto })
  @ApiErrors(UNAUTHORIZED, FORBIDDEN, NOT_FOUND)
  restoreLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
  ): Promise<AuthoringLessonSummaryView> {
    return this.curriculum.restoreLesson(user, lessonId);
  }
}
