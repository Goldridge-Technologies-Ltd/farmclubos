import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { AcademyController } from "./academy.controller.js";
import { AcademyService } from "./academy.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

/* The controller routes and nothing else; the rules are in the service. */
describe("AcademyController", () => {
  let controller: AcademyController;
  const academy = {
    listPathways: fn(),
    getPathway: fn(),
    getModule: fn(),
    getLesson: fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [AcademyController],
      providers: [{ provide: AcademyService, useValue: academy }],
    }).compile();

    controller = moduleRef.get(AcademyController);
  });

  it("returns the catalogue as the service gives it", async () => {
    academy.listPathways.mockResolvedValue([{ slug: "foundation" }]);

    await expect(controller.listPathways()).resolves.toEqual([{ slug: "foundation" }]);
  });

  it("passes each slug through in the order the path declares them", async () => {
    academy.getPathway.mockResolvedValue({});
    academy.getModule.mockResolvedValue({});
    academy.getLesson.mockResolvedValue({});

    await controller.getPathway("p");
    await controller.getModule("p", "m");
    await controller.getLesson("p", "m", "l");

    expect(academy.getPathway).toHaveBeenCalledWith("p");
    expect(academy.getModule).toHaveBeenCalledWith("p", "m");
    // Swapping two of these would silently open the wrong lesson.
    expect(academy.getLesson).toHaveBeenCalledWith("p", "m", "l");
  });
});
