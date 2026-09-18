import { jest } from "@jest/globals";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { HealthService } from "./health.service.js";

describe("HealthService", () => {
  let service: HealthService;
  let prisma: { isReachable: jest.Mock<() => Promise<boolean>> };

  beforeEach(async () => {
    prisma = { isReachable: jest.fn<() => Promise<boolean>>() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
      ],
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
    it("reports ok when the database answers", async () => {
      prisma.isReachable.mockResolvedValue(true);

      await expect(service.checkReadiness()).resolves.toEqual({
        status: "ok",
        checks: { database: "ok" },
      });
    });

    it("reports degraded when the database is unreachable", async () => {
      prisma.isReachable.mockResolvedValue(false);

      await expect(service.checkReadiness()).resolves.toEqual({
        status: "degraded",
        checks: { database: "down" },
      });
    });
  });
});
