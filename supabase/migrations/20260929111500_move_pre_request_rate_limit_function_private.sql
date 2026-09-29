-- Keep the pre-request rate-limit helper outside the exposed public API schema.
-- PostgREST executes the hook under the request role, so anon/authenticated need
-- schema usage and EXECUTE, while the private schema prevents /rpc exposure.

alter function public.monshaat_api_request_check() set schema private;

grant usage on schema private to anon, authenticated, authenticator;
grant execute on function private.monshaat_api_request_check() to anon, authenticated, authenticator;

alter role authenticator set pgrst.db_pre_request = 'private.monshaat_api_request_check';

notify pgrst, 'reload config';
