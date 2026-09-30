import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js";
import { PLATFORM_ROLES_KEY } from "../../common/decorators/roles.decorator.js";
import { ScenesController } from "./scenes.controller.js";
import { ScenesService } from "./scenes.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const author: AuthenticatedUser = {
  userId: "writer-1",
  sessionId: "session-1",
  email: "writer@example.com",
  platformRole: "PLATFORM_ADMIN",
  institutionId: null,
  institutionRole: null,
};

/* Thin by design: the rules live in ScenesService. */
describe("ScenesController", () => {
  let controller: ScenesController;
  const scenes = {
    createScene: fn(),
    getScene: fn(),
    updateScene: fn(),
    moveScene: fn(),
    removeScene: fn(),
    requestUpload: fn(),
    completeUpload: fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [ScenesController],
      providers: [{ provide: ScenesService, useValue: scenes }],
    }).compile();

    controller = moduleRef.get(ScenesController);
  });

  it("is open to the content team only", () => {
    expect(Reflect.getMetadata(PLATFORM_ROLES_KEY, ScenesController)).toEqual([
      "PLATFORM_ADMIN",
      "CONTENT_MANAGER",
    ]);
  });

  it("hands the service the caller, the id and the body", async () => {
    const upload = {
      purpose: "VIDEO" as const,
      fileName: "a.mp4",
      contentType: "video/mp4",
      sizeBytes: 10,
    };

    await controller.createScene(author, "lesson-1", { kind: "VIDEO", title: "Four flows" });
    await controller.requestUpload(author, "scene-1", upload);
    await controller.completeUpload(author, "asset-1");
    await controller.moveScene(author, "scene-1", { direction: "DOWN" });
    await controller.removeScene(author, "scene-1");

    expect(scenes.createScene).toHaveBeenCalledWith(author, "lesson-1", {
      kind: "VIDEO",
      title: "Four flows",
    });
    expect(scenes.requestUpload).toHaveBeenCalledWith(author, "scene-1", upload);
    expect(scenes.completeUpload).toHaveBeenCalledWith(author, "asset-1");
    expect(scenes.moveScene).toHaveBeenCalledWith(author, "scene-1", "DOWN");
    expect(scenes.removeScene).toHaveBeenCalledWith(author, "scene-1");
  });
});
