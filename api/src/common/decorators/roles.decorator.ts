import { SetMetadata } from "@nestjs/common";
import type { InstitutionRole, PlatformRole } from "../../generated/prisma/enums.js";

export const PLATFORM_ROLES_KEY = "platform_roles";
export const INSTITUTION_ROLES_KEY = "institution_roles";

/** Restricts a route to users holding one of these platform-wide roles. */
export const PlatformRoles = (...roles: PlatformRole[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);

/**
 * Restricts a route to users holding one of these roles in their *active*
 * institution. For a route that names an institution in its path, check access
 * to that institution in the service instead: the token only knows the active
 * one.
 *
 * When a route carries both decorators, holding either role is enough.
 */
export const InstitutionRoles = (...roles: InstitutionRole[]) =>
  SetMetadata(INSTITUTION_ROLES_KEY, roles);
