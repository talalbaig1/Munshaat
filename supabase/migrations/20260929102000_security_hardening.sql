-- Munshaat security hardening
-- Applied to the hosted Munshaat project before this migration was committed.

create schema if not exists private;

alter table public.monshaat_tasks
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.monshaat_sessions
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

alter table public.monshaat_emails
  alter column uploaded_by set default auth.uid();

alter table public.monshaat_audit_log
  add column if not exists actor_id uuid references auth.users(id) on delete set null;

update public.monshaat_tasks
set owner_id = (select id from auth.users order by created_at limit 1)
where owner_id is null;

create index if not exists monshaat_tasks_owner_idx on public.monshaat_tasks(owner_id);
create index if not exists monshaat_sessions_owner_idx on public.monshaat_sessions(owner_id);
create index if not exists monshaat_emails_uploaded_by_idx on public.monshaat_emails(uploaded_by);
create index if not exists monshaat_recommendations_source_email_idx on public.monshaat_recommendations(source_email_id);
create index if not exists monshaat_evidence_task_idx on public.monshaat_evidence(task_id);

drop policy if exists "authenticated manage consultants" on public.monshaat_consultants;
drop policy if exists "authenticated manage sessions" on public.monshaat_sessions;
drop policy if exists "authenticated manage recommendations" on public.monshaat_recommendations;
drop policy if exists "authenticated manage tasks" on public.monshaat_tasks;
drop policy if exists "authenticated manage notes" on public.monshaat_task_notes;
drop policy if exists "authenticated manage questions" on public.monshaat_follow_up_questions;
drop policy if exists "authenticated manage evidence" on public.monshaat_evidence;
drop policy if exists "authenticated manage evidence reviews" on public.monshaat_evidence_reviews;
drop policy if exists "authenticated manage emails" on public.monshaat_emails;
drop policy if exists "authenticated read audit log" on public.monshaat_audit_log;

create policy "authenticated read consultants"
on public.monshaat_consultants for select to authenticated using (true);

create policy "owners read sessions"
on public.monshaat_sessions for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "owners insert sessions"
on public.monshaat_sessions for insert to authenticated
with check ((select auth.uid()) = owner_id);

create policy "owners update sessions"
on public.monshaat_sessions for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "owners delete sessions"
on public.monshaat_sessions for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy "owners read recommendations"
on public.monshaat_recommendations for select to authenticated
using (exists (
  select 1 from public.monshaat_sessions s
  where s.id = monshaat_recommendations.session_id
    and s.owner_id = (select auth.uid())
));

create policy "owners insert recommendations"
on public.monshaat_recommendations for insert to authenticated
with check (exists (
  select 1 from public.monshaat_sessions s
  where s.id = monshaat_recommendations.session_id
    and s.owner_id = (select auth.uid())
));

create policy "owners update recommendations"
on public.monshaat_recommendations for update to authenticated
using (exists (
  select 1 from public.monshaat_sessions s
  where s.id = monshaat_recommendations.session_id
    and s.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.monshaat_sessions s
  where s.id = monshaat_recommendations.session_id
    and s.owner_id = (select auth.uid())
));

create policy "owners delete recommendations"
on public.monshaat_recommendations for delete to authenticated
using (exists (
  select 1 from public.monshaat_sessions s
  where s.id = monshaat_recommendations.session_id
    and s.owner_id = (select auth.uid())
));

create policy "owners read tasks"
on public.monshaat_tasks for select to authenticated
using ((select auth.uid()) = owner_id);

create policy "owners insert tasks"
on public.monshaat_tasks for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and (
    recommendation_id is null
    or exists (
      select 1
      from public.monshaat_recommendations r
      join public.monshaat_sessions s on s.id = r.session_id
      where r.id = monshaat_tasks.recommendation_id
        and s.owner_id = (select auth.uid())
    )
  )
);

create policy "owners update tasks"
on public.monshaat_tasks for update to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id
  and (
    recommendation_id is null
    or exists (
      select 1
      from public.monshaat_recommendations r
      join public.monshaat_sessions s on s.id = r.session_id
      where r.id = monshaat_tasks.recommendation_id
        and s.owner_id = (select auth.uid())
    )
  )
);

create policy "owners delete tasks"
on public.monshaat_tasks for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy "owners read notes"
on public.monshaat_task_notes for select to authenticated
using (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_task_notes.task_id and t.owner_id = (select auth.uid())
));

create policy "owners insert notes"
on public.monshaat_task_notes for insert to authenticated
with check (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_task_notes.task_id and t.owner_id = (select auth.uid())
));

create policy "owners update notes"
on public.monshaat_task_notes for update to authenticated
using (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_task_notes.task_id and t.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_task_notes.task_id and t.owner_id = (select auth.uid())
));

create policy "owners delete notes"
on public.monshaat_task_notes for delete to authenticated
using (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_task_notes.task_id and t.owner_id = (select auth.uid())
));

create policy "owners read questions"
on public.monshaat_follow_up_questions for select to authenticated
using (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_follow_up_questions.task_id and t.owner_id = (select auth.uid())
));

create policy "owners insert questions"
on public.monshaat_follow_up_questions for insert to authenticated
with check (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_follow_up_questions.task_id and t.owner_id = (select auth.uid())
));

create policy "owners update questions"
on public.monshaat_follow_up_questions for update to authenticated
using (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_follow_up_questions.task_id and t.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_follow_up_questions.task_id and t.owner_id = (select auth.uid())
));

create policy "owners delete questions"
on public.monshaat_follow_up_questions for delete to authenticated
using (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_follow_up_questions.task_id and t.owner_id = (select auth.uid())
));

create policy "owners read evidence"
on public.monshaat_evidence for select to authenticated
using (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_evidence.task_id and t.owner_id = (select auth.uid())
));

create policy "owners insert evidence"
on public.monshaat_evidence for insert to authenticated
with check (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_evidence.task_id and t.owner_id = (select auth.uid())
));

create policy "owners update evidence"
on public.monshaat_evidence for update to authenticated
using (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_evidence.task_id and t.owner_id = (select auth.uid())
))
with check (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_evidence.task_id and t.owner_id = (select auth.uid())
));

create policy "owners delete evidence"
on public.monshaat_evidence for delete to authenticated
using (exists (
  select 1 from public.monshaat_tasks t
  where t.id = monshaat_evidence.task_id and t.owner_id = (select auth.uid())
));

create policy "owners read evidence reviews"
on public.monshaat_evidence_reviews for select to authenticated
using (exists (
  select 1
  from public.monshaat_evidence e
  join public.monshaat_tasks t on t.id = e.task_id
  where e.id = monshaat_evidence_reviews.evidence_id
    and t.owner_id = (select auth.uid())
));

create policy "owners insert evidence reviews"
on public.monshaat_evidence_reviews for insert to authenticated
with check (exists (
  select 1
  from public.monshaat_evidence e
  join public.monshaat_tasks t on t.id = e.task_id
  where e.id = monshaat_evidence_reviews.evidence_id
    and t.owner_id = (select auth.uid())
));

create policy "owners update evidence reviews"
on public.monshaat_evidence_reviews for update to authenticated
using (exists (
  select 1
  from public.monshaat_evidence e
  join public.monshaat_tasks t on t.id = e.task_id
  where e.id = monshaat_evidence_reviews.evidence_id
    and t.owner_id = (select auth.uid())
))
with check (exists (
  select 1
  from public.monshaat_evidence e
  join public.monshaat_tasks t on t.id = e.task_id
  where e.id = monshaat_evidence_reviews.evidence_id
    and t.owner_id = (select auth.uid())
));

create policy "owners delete evidence reviews"
on public.monshaat_evidence_reviews for delete to authenticated
using (exists (
  select 1
  from public.monshaat_evidence e
  join public.monshaat_tasks t on t.id = e.task_id
  where e.id = monshaat_evidence_reviews.evidence_id
    and t.owner_id = (select auth.uid())
));

create policy "owners read emails"
on public.monshaat_emails for select to authenticated
using ((select auth.uid()) = uploaded_by);

create policy "owners insert emails"
on public.monshaat_emails for insert to authenticated
with check ((select auth.uid()) = uploaded_by);

create policy "owners update emails"
on public.monshaat_emails for update to authenticated
using ((select auth.uid()) = uploaded_by)
with check ((select auth.uid()) = uploaded_by);

create policy "owners delete emails"
on public.monshaat_emails for delete to authenticated
using ((select auth.uid()) = uploaded_by);

create policy "no client audit access"
on public.monshaat_audit_log as restrictive for all to authenticated
using (false) with check (false);

revoke all on all tables in schema public from anon;
revoke all on table public.monshaat_audit_log from anon, authenticated;

grant select on public.monshaat_consultants to authenticated;
grant select, insert, update, delete on
  public.monshaat_sessions,
  public.monshaat_recommendations,
  public.monshaat_tasks,
  public.monshaat_task_notes,
  public.monshaat_follow_up_questions,
  public.monshaat_evidence,
  public.monshaat_evidence_reviews,
  public.monshaat_emails
to authenticated;

drop policy if exists "authenticated read monshaat evidence objects" on storage.objects;
drop policy if exists "authenticated upload monshaat evidence objects" on storage.objects;
drop policy if exists "authenticated update monshaat evidence objects" on storage.objects;
drop policy if exists "authenticated delete monshaat evidence objects" on storage.objects;
drop policy if exists "authenticated manage email source" on storage.objects;

create policy "owners read monshaat evidence objects"
on storage.objects for select to authenticated
using (bucket_id = 'monshaat-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "owners upload monshaat evidence objects"
on storage.objects for insert to authenticated
with check (bucket_id = 'monshaat-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "owners update monshaat evidence objects"
on storage.objects for update to authenticated
using (bucket_id = 'monshaat-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'monshaat-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "owners delete monshaat evidence objects"
on storage.objects for delete to authenticated
using (bucket_id = 'monshaat-evidence'
  and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "owners manage monshaat email source"
on storage.objects for all to authenticated
using (bucket_id = 'monshaat-email-source'
  and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'monshaat-email-source'
  and (storage.foldername(name))[1] = (select auth.uid()::text));

update storage.buckets
set file_size_limit = 15728640
where id in ('monshaat-evidence','monshaat-email-source');

create table if not exists private.monshaat_api_rate_limits (
  ip inet not null,
  request_at timestamptz not null default pg_catalog.now()
);

create index if not exists monshaat_api_rate_limits_ip_time_idx
  on private.monshaat_api_rate_limits(ip, request_at desc);

revoke all on table private.monshaat_api_rate_limits from public, anon, authenticated;

create or replace function public.monshaat_api_request_check()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_method text := pg_catalog.current_setting('request.method', true);
  v_headers jsonb;
  v_ip_text text;
  v_ip inet;
  v_count integer;
begin
  if v_method is null or v_method in ('GET','HEAD') then return; end if;

  v_headers := coalesce(nullif(pg_catalog.current_setting('request.headers', true), ''), '{}')::jsonb;
  v_ip_text := pg_catalog.split_part(
    coalesce(v_headers->>'cf-connecting-ip', v_headers->>'x-forwarded-for', ''), ',', 1);

  begin
    v_ip := nullif(pg_catalog.btrim(v_ip_text), '')::inet;
  exception when others then
    return;
  end;

  if v_ip is null then return; end if;

  select count(*) into v_count
  from private.monshaat_api_rate_limits
  where ip = v_ip
    and request_at >= pg_catalog.now() - pg_catalog.make_interval(mins => 5);

  if v_count >= 100 then
    raise sqlstate 'PGRST'
      using
        message = pg_catalog.json_build_object(
          'message','Write rate limit exceeded. Try again in a few minutes.')::text,
        detail = pg_catalog.json_build_object(
          'status',429,'status_text','Too Many Requests')::text;
  end if;

  insert into private.monshaat_api_rate_limits(ip) values (v_ip);
end;
$$;

revoke execute on function public.monshaat_api_request_check() from public, anon, authenticated;
grant execute on function public.monshaat_api_request_check() to authenticator;

alter role authenticator set pgrst.db_pre_request = 'public.monshaat_api_request_check';
notify pgrst, 'reload config';

create index if not exists monshaat_audit_log_actor_idx
  on public.monshaat_audit_log(actor_id);
