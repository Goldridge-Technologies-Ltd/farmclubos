import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { HealthController } from "./health.controller.js";
import { HealthService } from "./health.service.js";

describe("HealthController", () => {
  let controller: HealthController;
  let service: jest.Mocked<Pick<HealthService, "checkLiveness" | "checkReadiness">>;

  beforeEach(async () => {
    service = {
      checkLiveness: jest.fn(),
      checkReadiness: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    })
      .useMocker((token) => (token === HealthService ? service : undefined))
      .compile();

    controller = moduleRef.get(HealthController);
  });

  it("returns the service's liveness result unwrapped", () => {
    service.checkLiveness.mockReturnValue({ status: "ok", uptime: 12 });

    expect(controller.getLiveness()).toEqual({ status: "ok", uptime: 12 });
  });

  it("returns the service's readiness result unwrapped", async () => {
    service.checkReadiness.mockResolvedValue({ status: "ok", checks: {} });

    await expect(controller.getReadiness()).resolves.toEqual({
      status: "ok",
      checks: {},
    });
  });
});
