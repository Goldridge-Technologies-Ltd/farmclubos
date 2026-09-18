/*
  Prisma 7 moved the connection URL out of schema.prisma: the CLI reads it from
  here, and the running application passes its own to the driver adapter in
  src/lib/database/prisma.service.ts. So schema.prisma holds nothing
  environment-specific, and switching between a local Postgres and Supabase is
  purely a matter of environment variables.

  The CLI needs a *direct* (session) connection: migrations run DDL and take
  advisory locks, which a transaction pooler cannot carry. Supabase's session
  pooler on port 5432 is fine; its transaction pooler on 6543 is not. Set
  DIRECT_URL when the two differ, otherwise DATABASE_URL is used for both.

  The datasource is omitted rather than defaulted when no URL is set, because
  `prisma generate` needs no connection — and it runs from `type-check` and
  `prebuild`, which must work on a fresh clone that has no .env yet. Commands
  that do need a connection raise their own error.
*/
import "dotenv/config";
import { defineConfig } from "prisma/config";

const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
