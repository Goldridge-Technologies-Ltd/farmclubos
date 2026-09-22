import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../database/prisma.service.js";

/*
  Throttling for credential attacks.

  Counts *failures*, not requests. Someone who mistypes a password and reloads
  is not an attacker, so only a failed attempt costs anything and a success
  clears the tally — which is why @nestjs/throttler, which counts requests
  into per-instance memory, is not what is wanted here.

  Keys are hashed before they are stored. The counter table would otherwise
  accumulate every email anyone ever typed at the sign-in form, including the
  ones that do not exist: precisely an attacker's spray list, sitting in the
  database.
*/

export type RateLimitRule = {
  /** What is being limited: "login", "password-reset". */
  scope: string;
  /** Failures allowed inside the window before the key is blocked. */
  limit: number;
  windowSeconds: number;
  blockSeconds: number;
};

/** How often a write also clears counters nobody has touched for a day. */
const PRUNE_PROBABILITY = 0.05;
const PRUNE_AFTER_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class RateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Refuses the request when any of these keys is currently blocked. Call it
   * before doing the expensive work, so a blocked attacker costs nothing.
   */
  async assertNotBlocked(scope: string, keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    const now = new Date();
    const blocked = await this.prisma.rateLimitCounter.findMany({
      where: {
        scope,
        key: { in: keys.map(hashKey) },
        blockedUntil: { gt: now },
      },
      select: { blockedUntil: true },
    });

    // The query already excludes expired blocks; checking again here means a
    // stale row can never refuse someone who should be let through.
    const until = Math.max(
      0,
      ...blocked.map((counter) => counter.blockedUntil?.getTime() ?? 0),
    );

    if (until <= now.getTime()) {
      return;
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((until - now.getTime()) / 1000));

    throw new HttpException(
      {
        code: "TOO_MANY_ATTEMPTS",
        /*
          The wait goes in the message, not only the header. "Wait a few
          minutes" against a 15-minute block sends someone back to the form
          every minute until they give up. It counts down as time passes, so
          it stays true, and every client gets it without doing the arithmetic.
        */
        message: `Too many attempts. Try again ${describeWait(retryAfterSeconds)}.`,
        details: { retryAfterSeconds },
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  /**
   * Charges one attempt against each key, blocking once the limit is reached.
   *
   * Sign-in charges only for a *failed* attempt, so a working password costs
   * nothing; a password-reset request charges for every one, because there the
   * request itself is the cost — an email sent to someone's inbox.
   */
  async recordAttempt(rule: RateLimitRule, keys: string[]): Promise<void> {
    const now = new Date();
    const windowOpenedAfter = new Date(now.getTime() - rule.windowSeconds * 1000);

    for (const key of keys) {
      await this.prisma.$transaction(async (tx) => {
        const existing = await tx.rateLimitCounter.findUnique({
          where: { scope_key: { scope: rule.scope, key: hashKey(key) } },
          select: { id: true, failures: true, windowStartedAt: true, blockedUntil: true },
        });

        if (!existing) {
          await tx.rateLimitCounter.create({
            data: {
              scope: rule.scope,
              key: hashKey(key),
              failures: 1,
              windowStartedAt: now,
            },
          });

          return;
        }

        // A window that has run out starts again: failures expire rather than
        // accumulating forever against someone who occasionally mistypes.
        if (existing.windowStartedAt < windowOpenedAfter) {
          await tx.rateLimitCounter.update({
            where: { id: existing.id },
            data: { failures: 1, windowStartedAt: now, blockedUntil: null },
          });

          return;
        }

        const failures = existing.failures + 1;

        await tx.rateLimitCounter.update({
          where: { id: existing.id },
          data: {
            failures,
            blockedUntil:
              failures >= rule.limit
                ? new Date(now.getTime() + rule.blockSeconds * 1000)
                : existing.blockedUntil,
          },
        });
      });
    }

    await this.pruneOccasionally(rule.scope, now);
  }

  /** Forgets a key's failures. Called after a success. */
  async clear(scope: string, keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    await this.prisma.rateLimitCounter.deleteMany({
      where: { scope, key: { in: keys.map(hashKey) } },
    });
  }

  /*
    An attacker working through a list of addresses would otherwise leave a row
    per address. Cleaning up on a fraction of writes keeps the table bounded
    without paying for a scan on every attempt, and without a scheduler.
  */
  private async pruneOccasionally(scope: string, now: Date): Promise<void> {
    if (Math.random() >= PRUNE_PROBABILITY) {
      return;
    }

    await this.prisma.rateLimitCounter.deleteMany({
      where: { scope, updatedAt: { lt: new Date(now.getTime() - PRUNE_AFTER_MS) } },
    });
  }
}

/** A wait a person can act on, rounded up so it is never an understatement. */
function describeWait(seconds: number): string {
  if (seconds < 60) {
    return "in less than a minute";
  }

  const minutes = Math.ceil(seconds / 60);

  if (minutes < 60) {
    return `in about ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.ceil(minutes / 60);

  return `in about ${hours} hour${hours === 1 ? "" : "s"}`;
}

function hashKey(key: string): string {
  return createHash("sha256").update(key.trim().toLowerCase()).digest("hex");
}
