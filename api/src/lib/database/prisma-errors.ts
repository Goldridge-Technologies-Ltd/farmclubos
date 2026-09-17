import { Prisma } from "../../generated/prisma/client.js";

/**
 * True when a write failed on a unique constraint (P2002). Used where two
 * requests can race to create the same row, so the loser gets a clear 409
 * rather than a 500.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
