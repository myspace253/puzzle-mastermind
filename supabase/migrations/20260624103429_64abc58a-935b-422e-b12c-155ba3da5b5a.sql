
ALTER VIEW public.leaderboard_global SET (security_invoker = true);
ALTER VIEW public.leaderboard_per_level SET (security_invoker = true);
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
