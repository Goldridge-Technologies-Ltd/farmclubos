import "server-only";

import { notFound } from "next/navigation";
import { canAdministerPlatform } from "../navigation";
import { getSessionContext } from "../session";
import { apiPage, apiRequest, type Page } from "./client";
import type { ContentTeam, Institution, Readiness, ServiceVersion } from "./contracts";
import { isApiError, isMissingRecord } from "./errors";

/*
  The reads behind the platform's own screens.

  Here the institution *does* come from the URL — choosing among every
  institution is the whole job — unlike the /institution screens, which only
  ever work on the one the session is pinned to. The API confirms the platform
  role against the database on every request, so a URL naming an institution
  grants nothing the role does not.

  Each read checks the role itself, not only the section's layout: a page
  renders alongside its layout, so its request would otherwise still reach
  the API, and fail there, for someone the layout is already turning away.
*/

/** Someone who is not a platform administrator gets a 404, as from the API. */
export async function assertPlatformAdministrator(): Promise<void> {
  const session = await getSessionContext();

  if (!session || !canAdministerPlatform(session)) {
    notFound();
  }
}

/** One page is plenty for now; the screen says so when there are more. */
export const INSTITUTIONS_PER_PAGE = 100;

export async function listInstitutions(search?: string): Promise<Page<Institution>> {
  const query = new URLSearchParams({ pageSize: String(INSTITUTIONS_PER_PAGE) });

  if (search) {
    query.set("search", search);
  }

  await assertPlatformAdministrator();

  return apiPage<Institution>(`/api/institutions?${query.toString()}`);
}

export async function getInstitution(institutionId: string): Promise<Institution> {
  await assertPlatformAdministrator();

  try {
    return await apiRequest<Institution>(
      `/api/institutions/${encodeURIComponent(institutionId)}`,
    );
  } catch (error) {
    if (isMissingRecord(error)) {
      notFound();
    }

    throw error;
  }
}

/** Who is on the content team, and the invitations onto it still open. */
export async function getContentTeam(): Promise<ContentTeam> {
  await assertPlatformAdministrator();

  return apiRequest<ContentTeam>("/api/content-team");
}

/* ── The system ──────────────────────────────────────────────────────────
   Both probes are public, being for load balancers too, so no token goes.
   An API that does not answer is reported as such rather than failing the
   page: saying so is what the page is for. */

/** The commit and branch the API was deployed from, or null if it did not answer. */
export async function getApiVersion(): Promise<ServiceVersion | null> {
  try {
    return await apiRequest<ServiceVersion>("/health/version", { authenticated: false });
  } catch {
    return null;
  }
}

/**
 * Whether the API can serve. It answers 503 when a dependency is down, with
 * the failing checks as the error's details. Null if it did not answer.
 */
export async function getApiReadiness(): Promise<Readiness | null> {
  try {
    return await apiRequest<Readiness>("/health/ready", { authenticated: false });
  } catch (error) {
    if (isApiError(error) && error.code === "NOT_READY" && isChecks(error.details)) {
      return { status: "degraded", checks: error.details };
    }

    return null;
  }
}

function isChecks(value: unknown): value is Readiness["checks"] {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((state) => state === "ok" || state === "down")
  );
}
