-- Munshaat tracker schema reference.
-- The production Munshaat Supabase project already has this migration applied.
-- This file is kept in GitHub so the backend schema is versioned with the application.

create table if not exists public.monshaat_consultants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text,
  role text,
  contact text,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monshaat_sessions (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid references public.monshaat_consultants(id),
  session_date date,
  title text not null,
  summary text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monshaat_recommendations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.monshaat_sessions(id),
  title text not null,
  description text,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monshaat_tasks (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid references public.monshaat_recommendations(id),
  parent_task_id uuid references public.monshaat_tasks(id),
  phase integer,
  phase_name text,
  task_key text unique,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','in_progress','blocked','completed','needs_verification')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  progress integer not null default 0 check (progress between 0 and 100),
  blocker_reason text,
  needs_verification boolean not null default false,
  owner text,
  due_date date,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.monshaat_task_notes (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.monshaat_tasks(id) on delete cascade,
  note text not null,
  author text,
  created_at timestamptz not null default now()
);

create table if not exists public.monshaat_follow_up_questions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.monshaat_tasks(id) on delete cascade,
  question text not null,
  answer text,
  status text not null default 'open' check (status in ('open','answered','dismissed')),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

create table if not exists public.monshaat_evidence (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.monshaat_tasks(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  file_size bigint,
  uploaded_by text,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','needs_review')),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.monshaat_evidence_reviews (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null references public.monshaat_evidence(id) on delete cascade,
  reviewer text,
  review_type text,
  result text,
  confidence numeric,
  rationale text,
  created_at timestamptz not null default now()
);

create table if not exists public.monshaat_audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id uuid,
  action text not null,
  actor text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.monshaat_consultants enable row level security;
alter table public.monshaat_sessions enable row level security;
alter table public.monshaat_recommendations enable row level security;
alter table public.monshaat_tasks enable row level security;
alter table public.monshaat_task_notes enable row level security;
alter table public.monshaat_follow_up_questions enable row level security;
alter table public.monshaat_evidence enable row level security;
alter table public.monshaat_evidence_reviews enable row level security;
alter table public.monshaat_audit_log enable row level security;

-- Production policy definitions are managed in Supabase. Keep this migration
-- additive and do not run it against the existing project without reviewing
-- existing policies first.