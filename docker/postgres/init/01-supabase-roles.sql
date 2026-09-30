-- Supabase has the `anon` and `authenticated` roles; a plain Postgres does not.
-- The row-level security migrations revoke privileges from both, so they must
-- exist before `npm run db:deploy --workspace api` runs against this database.
-- Postgres runs this once, when the data volume is first created.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;
