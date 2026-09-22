import { jest } from "@jest/globals";
import { HttpStatus } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../database/prisma.service.js";
import { RateLimitService, type RateLimitRule } from "./rate-limit.service.js";

type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const fn = (): AsyncMock => jest.fn<(...args: unknown[]) => Promise<unknown>>();

const RULE: RateLimitRule = {
  scope: "login",
  limit: 3,
  windowSeconds: 900,
  blockSeconds: 900,
};

const secondsAgo = (seconds: number) => new Date(Date.now() - seconds * 1000);
const secondsAhead = (seconds: number) => new Date(Date.now() + seconds * 1000);

describe("RateLimitService", () => {
  let service: RateLimitService;
  let counter: Record<"findMany" | "findUnique" | "create" | "update" | "deleteMany", AsyncMock>;
  let prisma: { rateLimitCounter: typeof counter; $transaction: jest.Mock<(work: (tx: unknown) => Promise<unknown>) => Promise<unknown>> };

  beforeEach(async () => {
    counter = { findMany: fn(), findUnique: fn(), create: fn(), update: fn(), deleteMany: fn() };
    prisma = {
      rateLimitCounter: counter,
      $transaction: jest.fn((work: (tx: unknown) => Promise<unknown>) => work(prisma)),
    };
    counter.findMany.mockResolvedValue([]);
    counter.findUnique.mockResolvedValue(null);
    // Keep the opportunistic prune out of the way of the assertions.
    jest.spyOn(Math, "random").mockReturnValue(0.99);

    const moduleRef = await Test.createTestingModule({
      providers: [RateLimitService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(RateLimitService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe("assertNotBlocked", () => {
    it("allows a key with no history", async () => {
      await expect(service.assertNotBlocked("login", ["ada@example.com"])).resolves.toBeUndefined();
    });

    it("never stores the key in the clear, so the table is not a list of attempted emails", async () => {
      await service.assertNotBlocked("login", ["ada@example.com"]);

      const where = (counter.findMany.mock.calls[0]?.[0] as { where: { key: { in: string[] } } }).where;
      expect(where.key.in[0]).not.toContain("ada@example.com");
      expect(where.key.in[0]).toMatch(/^[0-9a-f]{64}$/);
    });

    it("refuses a blocked key with 429 and how long to wait", async () => {
      counter.findMany.mockResolvedValue([{ blockedUntil: secondsAhead(120) }]);

      const refusal = service.assertNotBlocked("login", ["ada@example.com"]);

      await expect(refusal).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
        response: { code: "TOO_MANY_ATTEMPTS", details: { retryAfterSeconds: expect.any(Number) } },
      });
    });

    it.each([
      [30, "in less than a minute"],
      [890, "in about 15 minutes"],
      [3590, "in about 1 hour"],
    ])("says how long to wait when it is %ps away", async (seconds, expected) => {
      counter.findMany.mockResolvedValue([{ blockedUntil: secondsAhead(seconds) }]);

      /*
        "Wait a few minutes" against a 15-minute block sends someone back to
        the form every minute until they give up. The number is already known
        here, so the message carries it — and it counts down, so it stays true.
      */
      await expect(service.assertNotBlocked("login", ["ada@example.com"])).rejects.toMatchObject({
        response: { message: `Too many attempts. Try again ${expected}.` },
      });
    });

    it("allows a key whose block has passed", async () => {
      counter.findMany.mockResolvedValue([{ blockedUntil: secondsAgo(1) }]);

      await expect(service.assertNotBlocked("login", ["ada@example.com"])).resolves.toBeUndefined();
    });

    it("reports the longest wait when several keys are blocked", async () => {
      counter.findMany.mockResolvedValue([
        { blockedUntil: secondsAhead(60) },
        { blockedUntil: secondsAhead(300) },
      ]);

      await expect(
        service.assertNotBlocked("login", ["ada@example.com", "203.0.113.5"]),
      ).rejects.toMatchObject({
        response: { details: { retryAfterSeconds: expect.any(Number) } },
      });
    });
  });

  describe("recordAttempt", () => {
    it("starts a window on the first failure", async () => {
      await service.recordAttempt(RULE, ["ada@example.com"]);

      expect(counter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ scope: "login", failures: 1 }),
      });
    });

    it("counts up inside the window without blocking yet", async () => {
      counter.findUnique.mockResolvedValue({
        id: "c1", failures: 1, windowStartedAt: secondsAgo(10), blockedUntil: null,
      });

      await service.recordAttempt(RULE, ["ada@example.com"]);

      expect(counter.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: expect.objectContaining({ failures: 2, blockedUntil: null }),
      });
    });

    it("blocks once the limit is reached", async () => {
      counter.findUnique.mockResolvedValue({
        id: "c1", failures: 2, windowStartedAt: secondsAgo(10), blockedUntil: null,
      });

      await service.recordAttempt(RULE, ["ada@example.com"]);

      const data = (counter.update.mock.calls[0]?.[0] as { data: { failures: number; blockedUntil: Date } }).data;
      expect(data.failures).toBe(3);
      expect(data.blockedUntil).toBeInstanceOf(Date);
      expect(data.blockedUntil.getTime()).toBeGreaterThan(Date.now());
    });

    it("forgives failures once the window has passed, so an old typo does not count", async () => {
      counter.findUnique.mockResolvedValue({
        id: "c1", failures: 2, windowStartedAt: secondsAgo(RULE.windowSeconds + 60), blockedUntil: null,
      });

      await service.recordAttempt(RULE, ["ada@example.com"]);

      expect(counter.update).toHaveBeenCalledWith({
        where: { id: "c1" },
        data: expect.objectContaining({ failures: 1, blockedUntil: null }),
      });
    });

    it("counts against every key it is given", async () => {
      await service.recordAttempt(RULE, ["ada@example.com", "203.0.113.5"]);

      expect(counter.create).toHaveBeenCalledTimes(2);
    });

    it("prunes stale counters now and then, rather than on every attempt", async () => {
      jest.spyOn(Math, "random").mockReturnValue(0.01);

      await service.recordAttempt(RULE, ["ada@example.com"]);

      expect(counter.deleteMany).toHaveBeenCalledWith({
        where: { scope: "login", updatedAt: { lt: expect.any(Date) } },
      });
    });
  });

  describe("clear", () => {
    it("forgets a key's failures after a success", async () => {
      await service.clear("login", ["ada@example.com"]);

      const where = (counter.deleteMany.mock.calls[0]?.[0] as { where: { scope: string; key: { in: string[] } } }).where;
      expect(where.scope).toBe("login");
      expect(where.key.in).toHaveLength(1);
    });

    it("does nothing when given no keys", async () => {
      await service.clear("login", []);

      expect(counter.deleteMany).not.toHaveBeenCalled();
    });
  });
});
