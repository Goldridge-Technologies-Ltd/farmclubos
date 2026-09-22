-- Supabase serves `public` over HTTPS through PostgREST, so every table needs
-- row-level security even when nothing is meant to read it directly. The
-- default-privileges revoke from the earlier migration already keeps `anon`
-- out; this closes the hole if a privilege is ever granted by hand.
--
-- The API connects as the owner, which bypasses RLS, so it is unaffected.
ALTER TABLE public."RateLimitCounter" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."RateLimitCounter" FROM anon, authenticated;
