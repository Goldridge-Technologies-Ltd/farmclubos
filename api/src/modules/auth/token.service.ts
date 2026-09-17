import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash, createHmac, randomBytes } from "node:crypto";
import {
  ACCESS_TOKEN_ALGORITHM,
  ACCESS_TOKEN_AUDIENCE,
  ACCESS_TOKEN_ISSUER,
  type AccessTokenClaims,
} from "../../common/auth/access-token.js";

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 256 bits from the CSPRNG. Used for refresh, invite and password-reset
   * tokens, which only ever reach the database as a hash.
   */
  generateOpaqueToken(): string {
    return randomBytes(32).toString("base64url");
  }

  /**
   * The database lookup key for an opaque token. A fast hash is right here: the
   * token carries 256 bits of entropy, so there is nothing to brute-force.
   */
  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /**
   * The refresh token that replaces `previous` on rotation.
   *
   * It is derived rather than random so that two concurrent refreshes of the
   * same token agree on its successor. That lets the reuse grace window hand
   * back the token already issued, without the database ever holding a raw
   * token. Without JWT_REFRESH_SECRET the derivation cannot be reproduced.
   */
  deriveSuccessorToken(previous: string): string {
    return createHmac("sha256", this.config.getOrThrow<string>("JWT_REFRESH_SECRET"))
      .update(previous)
      .digest("base64url");
  }

  async signAccessToken(
    claims: AccessTokenClaims,
  ): Promise<{ token: string; expiresAt: Date }> {
    const ttlSeconds = this.config.getOrThrow<number>("ACCESS_TOKEN_TTL_SECONDS");
    const issuedAt = Math.floor(Date.now() / 1000);

    const token = await this.jwt.signAsync(
      { ...claims, iat: issuedAt, exp: issuedAt + ttlSeconds },
      {
        algorithm: ACCESS_TOKEN_ALGORITHM,
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
      },
    );

    return { token, expiresAt: new Date((issuedAt + ttlSeconds) * 1000) };
  }
}
