import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "is_public";

/**
 * Every route requires a valid access token unless it is marked public — the
 * global JwtAuthGuard is secure by default, so forgetting a decorator fails
 * closed.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
