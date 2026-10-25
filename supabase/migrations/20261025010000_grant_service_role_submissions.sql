-- The first migration relied on Supabase's default table grants to service_role,
-- which projects without automatic Data API grants don't have. Grant only what the
-- Netlify Functions use: insert submissions, and read them for the leaderboard RPCs
-- (they run as the caller). No update or delete.

grant usage on schema public to service_role;
grant select, insert on public.game_submissions to service_role;
