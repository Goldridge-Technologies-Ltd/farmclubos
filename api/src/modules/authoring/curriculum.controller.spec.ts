import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PLATFORM_ROLES_KEY } from "../../common/decorators/roles.decorator.js";
import { CurriculumController } from "./curriculum.controller.js";
import { CurriculumService } from "./curriculum.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const author: AuthenticatedUser = {
  userId: "writer-1",
  sessionId: "session-1",
  email: "writer@example.com",
  platformRole: "CONTENT_MANAGER",
  institutionId: null,
  institutionRole: null,
};

/*
  Thin by design: every rule lives in CurriculumService. This checks the routes
  are closed to anyone off the content team, and hand the service the caller,
  the id from the path and the body, in that order.
*/
describe("CurriculumController", () => {
  let controller: CurriculumController;
  const curriculum = Object.fromEntries(
    [
      "listPathways",
      "getPathway",
      "createPathway",
      "updatePathway",
      "movePathway",
      "publishPathway",
      "unpublishPathway",
      "archivePathway",
      "restorePathway",
      "createModule",
      "getModule",
      "updateModule",
      "moveModule",
      "publishModule",
      "unpublishModule",
      "archiveModule",
      "restoreModule",
      "createLesson",
      "getLesson",
      "updateLesson",
      "moveLesson",
      "publishLesson",
      "unpublishLesson",
      "archiveLesson",
      "restoreLesson",
    ].map((name) => [name, fn()]),
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [CurriculumController],
      providers: [{ provide: CurriculumService, useValue: curriculum }],
    }).compile();

    controller = moduleRef.get(CurriculumController);
  });

  it("is open to the content team only", () => {
    expect(Reflect.getMetadata(PLATFORM_ROLES_KEY, CurriculumController)).toEqual([
      "PLATFORM_ADMIN",
      "CONTENT_MANAGER",
    ]);
  });

  it("hands the service the caller, the id and the body", async () => {
    await controller.createModule(author, "pathway-1", { title: "Enterprise Mindset" });
    await controller.updateLesson(author, "lesson-1", { summary: null });
    await controller.moveModule(author, "module-1", { direction: "UP" });

    expect(curriculum.createModule).toHaveBeenCalledWith(author, "pathway-1", {
      title: "Enterprise Mindset",
    });
    expect(curriculum.updateLesson).toHaveBeenCalledWith(author, "lesson-1", { summary: null });
    expect(curriculum.moveModule).toHaveBeenCalledWith(author, "module-1", "UP");
  });

  it("passes each lifecycle action to its own method", async () => {
    await controller.publishModule(author, "module-1");
    await controller.unpublishModule(author, "module-1");
    await controller.archiveModule(author, "module-1");
    await controller.restoreModule(author, "module-1");
    await controller.publishLesson(author, "lesson-1");
    await controller.unpublishLesson(author, "lesson-1");
    await controller.archiveLesson(author, "lesson-1");
    await controller.restoreLesson(author, "lesson-1");

    for (const name of ["publishModule", "unpublishModule", "archiveModule", "restoreModule"]) {
      expect(curriculum[name]).toHaveBeenCalledWith(author, "module-1");
    }
    for (const name of ["publishLesson", "unpublishLesson", "archiveLesson", "restoreLesson"]) {
      expect(curriculum[name]).toHaveBeenCalledWith(author, "lesson-1");
    }
  });

  it("hands pathway calls to their own methods", async () => {
    const created = { title: "Greenhouse Enterprise", summary: "Running a greenhouse." };

    await controller.createPathway(author, created);
    await controller.updatePathway(author, "pathway-1", { level: "INTERMEDIATE" });
    await controller.movePathway(author, "pathway-1", { direction: "DOWN" });
    await controller.publishPathway(author, "pathway-1");
    await controller.unpublishPathway(author, "pathway-1");
    await controller.archivePathway(author, "pathway-1");
    await controller.restorePathway(author, "pathway-1");

    expect(curriculum.createPathway).toHaveBeenCalledWith(author, created);
    expect(curriculum.updatePathway).toHaveBeenCalledWith(author, "pathway-1", {
      level: "INTERMEDIATE",
    });
    expect(curriculum.movePathway).toHaveBeenCalledWith(author, "pathway-1", "DOWN");
    for (const name of ["publishPathway", "unpublishPathway", "archivePathway", "restorePathway"]) {
      expect(curriculum[name]).toHaveBeenCalledWith(author, "pathway-1");
    }
  });
});
