import "server-only";

import { notFound } from "next/navigation";
import { canManageInstitution } from "../navigation";
import { getSessionContext } from "../session";
import { apiRequest } from "./client";
import type { CohortDetail, CohortListItem, Invite, Member } from "./contracts";
import { isMissingRecord } from "./errors";

/*
  The reads behind the institution's management screens.

  Every one works on the *active* institution — the one the access token is
  pinned to — rather than an id from the URL, so there is no path to type in
  that reaches someone else's institution. The API checks access again on
  every request regardless; this is so the screens never ask for anything the
  caller could not have.
*/

/**
 * The institution being managed. Someone who cannot manage it gets a 404,
 * as the API would give them, rather than a screen that fails piece by piece.
 */
export async function managedInstitution(): Promise<{ id: string; name: string }> {
  const session = await getSessionContext();

  if (!session?.activeInstitutionId || !canManageInstitution(session)) {
    notFound();
  }

  const membership = session.memberships.find(
    (item) => item.institutionId === session.activeInstitutionId,
  );

  return {
    id: session.activeInstitutionId,
    name: membership?.institutionName ?? "",
  };
}

export async function listMembers(institutionId: string): Promise<Member[]> {
  return apiRequest<Member[]>(`/api/institutions/${institutionId}/members`);
}

/** Invitations still waiting to be accepted. Lapsed ones are left out. */
export async function listPendingInvites(institutionId: string): Promise<Invite[]> {
  return apiRequest<Invite[]>(
    `/api/institutions/${institutionId}/invites?status=PENDING&pageSize=100`,
  );
}

export async function listCohorts(institutionId: string): Promise<CohortListItem[]> {
  return apiRequest<CohortListItem[]>(`/api/institutions/${institutionId}/cohorts`);
}

export async function getCohort(institutionId: string, cohortId: string): Promise<CohortDetail> {
  try {
    return await apiRequest<CohortDetail>(
      `/api/institutions/${institutionId}/cohorts/${encodeURIComponent(cohortId)}`,
    );
  } catch (error) {
    if (isMissingRecord(error)) {
      notFound();
    }

    throw error;
  }
}
