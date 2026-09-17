import type { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  type AccessTokenClaims,
} from "../../common/auth/access-token.js";
import { TokenService } from "./token.service.js";

const settings: Record<string, unknown> = {
  JWT_REFRESH_SECRET: "refresh-secret-that-is-long-enough-ok",
  ACCESS_TOKEN_TTL_SECONDS: 900,
};
const config = {
  getOrThrow: (key: string) => settings[key],
} as unknown as ConfigService;

const claims: AccessTokenClaims = {
  sub: "user-1",
  sid: "session-1",
  email: "ada@example.com",
  platformRole: "NONE",
  institutionId: null,
  institutionRole: null,
};

describe("TokenService", () => {
  const jwt = new JwtService({ secret: "access-secret-that-is-long-enough-ok" });
  const tokens = new TokenService(jwt, config);

  describe("opaque tokens", () => {
    it("generates 256 bits of URL-safe randomness", () => {
      const token = tokens.generateOpaqueToken();

      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(tokens.generateOpaqueToken()).not.toBe(token);
    });

    it("hashes a token deterministically for lookup", () => {
      expect(tokens.hashToken("abc")).toBe(tokens.hashToken("abc"));
      expect(tokens.hashToken("abc")).not.toBe(tokens.hashToken("abd"));
      expect(tokens.hashToken("abc")).toHaveLength(64);
    });
  });

  describe("deriveSuccessorToken", () => {
    it("derives the same successor from the same token, so concurrent refreshes agree", () => {
      expect(tokens.deriveSuccessorToken("previous")).toBe(
        tokens.deriveSuccessorToken("previous"),
      );
    });

    it("cannot be reproduced without the refresh secret", () => {
      const other = new TokenService(jwt, {
        getOrThrow: (key: string) =>
          key === "JWT_REFRESH_SECRET" ? "a-completely-different-refresh-secret" : 900,
      } as unknown as ConfigService);

      expect(other.deriveSuccessorToken("previous")).not.toBe(
        tokens.deriveSuccessorToken("previous"),
      );
    });

    it("produces a token in the same shape as a fresh one", () => {
      expect(tokens.deriveSuccessorToken("previous")).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });
  });

  describe("signAccessToken", () => {
    it("signs claims the guard will accept, with issuer, audience and expiry", async () => {
      const { token, expiresAt } = await tokens.signAccessToken(claims);

      const verified = await jwt.verifyAsync<AccessTokenClaims & { exp: number }>(token, {
        algorithms: ["HS256"],
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
      });

      expect(verified).toMatchObject(claims);
      expect(verified.exp * 1000).toBe(expiresAt.getTime());
    });

    it("expires after the configured lifetime", async () => {
      const before = Date.now();
      const { expiresAt } = await tokens.signAccessToken(claims);

      expect(expiresAt.getTime() - before).toBeGreaterThanOrEqual(899_000);
      expect(expiresAt.getTime() - before).toBeLessThanOrEqual(901_000);
    });
  });
});
