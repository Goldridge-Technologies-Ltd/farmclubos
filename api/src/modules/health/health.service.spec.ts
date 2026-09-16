import { Test } from "@nestjs/testing";
import { HealthService } from "./health.service.js";

describe("HealthService", () => {
  let service: HealthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = moduleRef.get(HealthService);
  });

  describe("checkLiveness", () => {
    it("reports ok with a whole number of seconds of uptime", () => {
      const result = service.checkLiveness();

      expect(result.status).toBe("ok");
      expect(Number.isInteger(result.uptime)).toBe(true);
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe("checkReadiness", () => {
    it("reports ok while no dependency check is registered", async () => {
      await expect(service.checkReadiness()).resolves.toEqual({
        status: "ok",
        checks: {},
      });
    });
  });
});
