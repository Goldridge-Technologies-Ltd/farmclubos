import { jest } from "@jest/globals";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../../lib/database/prisma.service.js";
import { HealthService } from "./health.service.js";

describe("HealthService", () => {
  let service: HealthService;
  let prisma: { isReachable: jest.Mock<() => Promise<boolean>> };
  let settings: Record<string, string | undefined>;

  beforeEach(async () => {
    prisma = { isReachable: jest.fn<() => Promise<boolean>>() };
    settings = {};

    const moduleRef = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: (key: string) => settings[key] } },
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

  /*
    Which commit is running, so a deployment can be confirmed without the
    hosting dashboards. Render sets its own variables on every deploy; a host
    that does not can set GIT_COMMIT and GIT_BRANCH instead, which win.
  */
  describe("version", () => {
    it("reports the commit and branch Render deployed", () => {
      settings = { RENDER_GIT_COMMIT: "ab8b86b2c4", RENDER_GIT_BRANCH: "main" };

      expect(service.version()).toEqual({ commit: "ab8b86b2c4", branch: "main" });
    });

    it("prefers GIT_COMMIT and GIT_BRANCH, set by a host of our own", () => {
      settings = {
        GIT_COMMIT: "7bf91ec0aa",
        GIT_BRANCH: "release",
        RENDER_GIT_COMMIT: "ab8b86b2c4",
        RENDER_GIT_BRANCH: "main",
      };

      expect(service.version()).toEqual({ commit: "7bf91ec0aa", branch: "release" });
    });

    it("says nothing it does not know, as on a laptop", () => {
      expect(service.version()).toEqual({ commit: null, branch: null });
    });
  });
});
