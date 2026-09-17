import { jest } from "@jest/globals";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { CUSTOM_MESSAGE_KEY } from "../../common/decorators/custom-message.decorator.js";
import { IS_PUBLIC_KEY } from "../../common/decorators/public.decorator.js";
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

  it("is public, because a load balancer probing it has no token", () => {
    expect(new Reflector().get(IS_PUBLIC_KEY, HealthController)).toBe(true);
  });

  describe("response messages", () => {
    const reflector = new Reflector();

    it("gives the liveness probe its own message", () => {
      expect(
        reflector.get<string>(
          CUSTOM_MESSAGE_KEY,
          HealthController.prototype.getLiveness,
        ),
      ).toBe("API is running");
    });

    it("gives the readiness probe a message that holds whether it passes or not", () => {
      // The decorator is static, so the message must not claim readiness: the
      // outcome is in data.status, which can be "degraded".
      expect(
        reflector.get<string>(
          CUSTOM_MESSAGE_KEY,
          HealthController.prototype.getReadiness,
        ),
      ).toBe("Readiness checks completed");
    });
  });

  it("returns the service's readiness result unwrapped", async () => {
    service.checkReadiness.mockResolvedValue({ status: "ok", checks: {} });

    await expect(controller.getReadiness()).resolves.toEqual({
      status: "ok",
      checks: {},
    });
  });
});
