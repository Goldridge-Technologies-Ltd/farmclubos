import "server-only";

import { notFound } from "next/navigation";
import { canAdministerPlatform } from "../navigation";
import { getSessionContext } from "../session";
import { apiPage, apiRequest, type Page } from "./client";
import type { ContentTeam, Institution } from "./contracts";
import { isMissingRecord } from "./errors";

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
