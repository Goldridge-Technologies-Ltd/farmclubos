import { NotFoundException, type INestApplication } from "@nestjs/common";
import type { Request, Response } from "express";
import { toErrorResponse } from "./common/filters/all-exceptions.filter.js";

/*
  Probes stay at the root so a load balancer or container healthcheck does not
  have to know the API's prefix.
*/
const UNPREFIXED_ROUTES = ["health", "health/ready"];

/**
 * Call before `app.init()`. Shared by main.ts and the end-to-end specs, so both
 * see the same routes.
 */
export function applyGlobalPrefix(app: INestApplication, prefix: string): void {
  app.setGlobalPrefix(prefix, { exclude: UNPREFIXED_ROUTES });
}

/**
 * Call after `app.init()`, so it lands after every route in Express's stack.
 *
 * Nest mounts its not-found handler under the global prefix only, so a request
 * for an unknown path outside it — `/nope`, `/health/typo` — would otherwise
 * fall through to Express's HTML 404 page: breaking the envelope contract and
 * announcing the framework to anyone probing.
 */
export function applyNotFoundFallback(app: INestApplication): void {
  app.use((request: Request, response: Response) => {
    const { status, body } = toErrorResponse(
      new NotFoundException(`Cannot ${request.method} ${request.originalUrl}`),
      request,
    );

    response.status(status).json(body);
  });
}
