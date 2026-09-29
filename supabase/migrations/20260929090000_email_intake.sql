-- Email intake, recommendation chronology, optional task timelines, and private source storage.
create table if not exists public.monshaat_emails (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references auth.users(id) on delete set null,
  file_name text,
  mime_type text,
  storage_path text,
  received_at timestamptz,
  raw_text text not null,
  language text default 'ar',
  status text not null default 'uploaded' check (status = any (array['uploaded','analyzed','approved','converted','failed'])),
  analysis jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.monshaat_emails enable row level security;
drop policy if exists "authenticated manage emails" on public.monshaat_emails;
create policy "authenticated manage emails" on public.monshaat_emails for all to authenticated using (true) with check (true);
alter table public.monshaat_recommendations add column if not exists received_date date;
alter table public.monshaat_recommendations add column if not exists source_email_id uuid references public.monshaat_emails(id) on delete set null;
create index if not exists idx_monshaat_emails_created_at on public.monshaat_emails(created_at desc);
create index if not exists idx_monshaat_recommendations_received_date on public.monshaat_recommendations(received_date desc);
create index if not exists idx_monshaat_tasks_due_date on public.monshaat_tasks(due_date);
insert into storage.buckets (id,name,public) values ('monshaat-email-source','monshaat-email-source',false) on conflict (id) do nothing;
drop policy if exists "authenticated manage email source" on storage.objects;
create policy "authenticated manage email source" on storage.objects for all to authenticated using (bucket_id='monshaat-email-source' and (storage.foldername(name))[1]=(select auth.uid()::text)) with check (bucket_id='monshaat-email-source' and (storage.foldername(name))[1]=(select auth.uid()::text));
