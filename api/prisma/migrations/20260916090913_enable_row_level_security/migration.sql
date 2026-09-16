-- Supabase serves the `public` schema over HTTPS through PostgREST, so a table
-- created by Prisma with row-level security off is readable by anyone holding
-- the project's anon key, without ever touching our API.
--
-- Enabling RLS with *no policies* denies every row to the `anon` and
-- `authenticated` roles. The API is unaffected: it connects as the table owner
-- (`postgres`, which carries BYPASSRLS), and so does the Supabase Studio table
-- editor. Our NestJS API stays the only way into this data.
--
-- Privileges are revoked as well, so the tables are closed even if a future
-- policy is added by accident.
--
-- A new table needs the same treatment: add it to a follow-up migration.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target.tablename);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', target.tablename);
  END LOOP;
END
$$;

-- Stop future Prisma-created tables inheriting PostgREST's default grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
