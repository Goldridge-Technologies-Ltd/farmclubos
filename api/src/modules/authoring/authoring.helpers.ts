import { NotFoundException } from "@nestjs/common";
import type { Prisma } from "../../generated/prisma/client.js";
import type { MoveDirection } from "./authoring.types.js";

/*
  Small rules the authoring services share: where a new item goes, how one
  moves, how text is tidied, and how a change is recorded.
*/

/** After the last, counting archived siblings, so a restore never collides. */
export function nextSequence(siblings: { sequence: number }[]): number {
  return siblings.reduce((max, item) => Math.max(max, item.sequence), 0) + 1;
}

/**
 * The sequence changes that move one item up or down among its siblings,
 * numbering them 1…n as it goes so ties from older data sort themselves out.
 * Empty when it is already at that end.
 */
export function reorder(
  siblings: { id: string; sequence: number }[],
  id: string,
  direction: MoveDirection,
): { id: string; sequence: number }[] {
  const from = siblings.findIndex((item) => item.id === id);
  const to = direction === "UP" ? from - 1 : from + 1;

  if (from === -1 || to < 0 || to >= siblings.length) {
    return [];
  }

  const order = [...siblings];
  [order[from], order[to]] = [order[to], order[from]];

  return order
    .map((item, index) => ({ id: item.id, sequence: index + 1, was: item.sequence }))
    .filter((item) => item.sequence !== item.was)
    .map(({ id: changed, sequence }) => ({ id: changed, sequence }));
}

/** Trimmed; empty becomes null, and undefined stays "not sent". */
export function clean(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value?.trim() ?? "";

  return trimmed === "" ? null : trimmed;
}

/** Platform content belongs to no institution, so its events carry none. */
export async function audit(
  tx: Prisma.TransactionClient,
  actorUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Prisma.InputJsonValue,
): Promise<void> {
  await tx.auditEvent.create({ data: { actorUserId, action, entityType, entityId, metadata } });
}

export function notFound(what: string): NotFoundException {
  return new NotFoundException({ code: "NOT_FOUND", message: `That ${what} does not exist.` });
}
