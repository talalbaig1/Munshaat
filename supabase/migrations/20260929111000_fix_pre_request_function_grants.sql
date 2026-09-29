-- Fix PostgREST pre-request execution grants.
-- PostgREST runs the configured pre-request function under the request role
-- (anon/authenticated), so the function must be executable by those roles.
-- Keep PUBLIC revoked; only Data API request roles and authenticator may execute it.

revoke execute on function public.monshaat_api_request_check() from public;
grant execute on function public.monshaat_api_request_check() to anon, authenticated, authenticator;

notify pgrst, 'reload config';
