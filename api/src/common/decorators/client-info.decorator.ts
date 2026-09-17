import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { ClientContext } from "../auth/client-context.js";

/**
 * The caller's user agent and address, for the session record. Behind the web
 * app the API sees the web app's server, so it prefers the forwarded client
 * address — which is why these values are informational only.
 */
export const ClientInfo = createParamDecorator(
  (_: unknown, context: ExecutionContext): ClientContext => {
    const request = context.switchToHttp().getRequest<Request>();
    const forwarded = request.headers["x-forwarded-for"];
    const firstForwarded = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      ?.split(",")[0]
      ?.trim();

    return {
      userAgent: request.headers["user-agent"]?.slice(0, 500),
      ipAddress: (firstForwarded || request.ip)?.slice(0, 100),
    };
  },
);
