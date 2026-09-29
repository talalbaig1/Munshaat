-- Allow task evidence to be either an uploaded image/file or an external web URL.
alter table public.monshaat_evidence
  alter column storage_path drop not null,
  alter column file_name drop not null;

alter table public.monshaat_evidence
  add column if not exists evidence_type text not null default 'file',
  add column if not exists source_url text;

alter table public.monshaat_evidence
  drop constraint if exists monshaat_evidence_type_check;

alter table public.monshaat_evidence
  add constraint monshaat_evidence_type_check
  check (evidence_type in ('file','image','url'));

alter table public.monshaat_evidence
  drop constraint if exists monshaat_evidence_source_check;

alter table public.monshaat_evidence
  add constraint monshaat_evidence_source_check
  check (
    (evidence_type in ('file','image')
      and storage_path is not null
      and source_url is null)
    or
    (evidence_type = 'url'
      and storage_path is null
      and source_url is not null
      and source_url ~* '^https?://[^[:space:]]+$')
  );

create index if not exists monshaat_evidence_type_idx
  on public.monshaat_evidence(evidence_type);