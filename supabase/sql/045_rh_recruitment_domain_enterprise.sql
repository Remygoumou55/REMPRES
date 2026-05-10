-- 045_rh_recruitment_domain_enterprise.sql
-- ATS / recrutement RH : candidats, entretiens, évaluations, documents, historique, onboarding.

begin;

create table if not exists public.rh_recruitment_candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text null,
  job_title text not null,
  department_key text null,
  pipeline_stage text not null default 'sourced'
    check (pipeline_stage in (
      'sourced', 'screening', 'interview', 'offer',
      'pending_hire_approval', 'hired', 'rejected', 'withdrawn'
    )),
  source_channel text not null default 'direct'
    check (source_channel in ('direct', 'referral', 'agency', 'website', 'other')),
  notes text null,
  hire_approval_request_id uuid null references public.approval_requests(id) on delete set null,
  hired_profile_id uuid null references public.profiles(id) on delete set null,
  hired_contract_id uuid null references public.rh_employee_contracts(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rh_recruitment_candidates_pipeline
  on public.rh_recruitment_candidates(pipeline_stage, updated_at desc);

create index if not exists idx_rh_recruitment_candidates_email
  on public.rh_recruitment_candidates(lower(email));

create table if not exists public.rh_recruitment_interviews (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.rh_recruitment_candidates(id) on delete cascade,
  interview_type text not null default 'hr'
    check (interview_type in ('phone', 'technical', 'hr', 'panel', 'other')),
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0 and duration_minutes <= 480),
  location_note text null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_rh_recruitment_interviews_candidate
  on public.rh_recruitment_interviews(candidate_id, scheduled_at desc);

create table if not exists public.rh_recruitment_evaluations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.rh_recruitment_candidates(id) on delete cascade,
  evaluator_user_id uuid not null references auth.users(id) on delete restrict,
  score integer null check (score is null or (score >= 1 and score <= 5)),
  recommendation text not null check (recommendation in ('hire', 'hold', 'no_hire')),
  comments text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rh_recruitment_evaluations_candidate
  on public.rh_recruitment_evaluations(candidate_id, created_at desc);

create table if not exists public.rh_recruitment_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.rh_recruitment_candidates(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  document_type text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text null,
  file_size_bytes bigint null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_rh_recruitment_documents_candidate
  on public.rh_recruitment_documents(candidate_id, created_at desc);

create table if not exists public.rh_recruitment_history (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.rh_recruitment_candidates(id) on delete cascade,
  event_type text not null,
  event_label text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_rh_recruitment_history_candidate
  on public.rh_recruitment_history(candidate_id, created_at desc);

create table if not exists public.rh_recruitment_onboarding (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique references public.rh_recruitment_candidates(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  checklist jsonb not null default '{}'::jsonb,
  linked_profile_id uuid null references public.profiles(id) on delete set null,
  linked_contract_id uuid null references public.rh_employee_contracts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rh_recruitment_candidates enable row level security;
alter table public.rh_recruitment_interviews enable row level security;
alter table public.rh_recruitment_evaluations enable row level security;
alter table public.rh_recruitment_documents enable row level security;
alter table public.rh_recruitment_history enable row level security;
alter table public.rh_recruitment_onboarding enable row level security;

drop policy if exists rh_recruitment_candidates_select on public.rh_recruitment_candidates;
create policy rh_recruitment_candidates_select
on public.rh_recruitment_candidates
for select
to authenticated
using (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'read')
  )
);

drop policy if exists rh_recruitment_candidates_insert on public.rh_recruitment_candidates;
create policy rh_recruitment_candidates_insert
on public.rh_recruitment_candidates
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.is_admin_role()
    or (
      public.is_rh_operator()
      and public.user_has_module_permission('rh', 'create')
    )
  )
);

drop policy if exists rh_recruitment_candidates_update on public.rh_recruitment_candidates;
create policy rh_recruitment_candidates_update
on public.rh_recruitment_candidates
for update
to authenticated
using (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
)
with check (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
);

drop policy if exists rh_recruitment_interviews_select on public.rh_recruitment_interviews;
create policy rh_recruitment_interviews_select
on public.rh_recruitment_interviews
for select
to authenticated
using (
  exists (
    select 1 from public.rh_recruitment_candidates c
    where c.id = candidate_id
      and (
        public.is_admin_role()
        or (public.is_rh_operator() and public.user_has_module_permission('rh', 'read'))
      )
  )
);

drop policy if exists rh_recruitment_interviews_insert on public.rh_recruitment_interviews;
create policy rh_recruitment_interviews_insert
on public.rh_recruitment_interviews
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.is_admin_role()
    or (
      public.is_rh_operator()
      and public.user_has_module_permission('rh', 'create')
    )
  )
);

drop policy if exists rh_recruitment_interviews_update on public.rh_recruitment_interviews;
create policy rh_recruitment_interviews_update
on public.rh_recruitment_interviews
for update
to authenticated
using (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
)
with check (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
);

drop policy if exists rh_recruitment_evaluations_select on public.rh_recruitment_evaluations;
create policy rh_recruitment_evaluations_select
on public.rh_recruitment_evaluations
for select
to authenticated
using (
  exists (
    select 1 from public.rh_recruitment_candidates c
    where c.id = candidate_id
      and (
        public.is_admin_role()
        or (public.is_rh_operator() and public.user_has_module_permission('rh', 'read'))
      )
  )
);

drop policy if exists rh_recruitment_evaluations_insert on public.rh_recruitment_evaluations;
create policy rh_recruitment_evaluations_insert
on public.rh_recruitment_evaluations
for insert
to authenticated
with check (
  evaluator_user_id = auth.uid()
  and (
    public.is_admin_role()
    or (
      public.is_rh_operator()
      and public.user_has_module_permission('rh', 'create')
    )
  )
);

drop policy if exists rh_recruitment_documents_select on public.rh_recruitment_documents;
create policy rh_recruitment_documents_select
on public.rh_recruitment_documents
for select
to authenticated
using (
  exists (
    select 1 from public.rh_recruitment_candidates c
    where c.id = candidate_id
      and (
        public.is_admin_role()
        or (public.is_rh_operator() and public.user_has_module_permission('rh', 'read'))
      )
  )
);

drop policy if exists rh_recruitment_documents_insert on public.rh_recruitment_documents;
create policy rh_recruitment_documents_insert
on public.rh_recruitment_documents
for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and (
    public.is_admin_role()
    or (
      public.is_rh_operator()
      and public.user_has_module_permission('rh', 'create')
    )
  )
);

drop policy if exists rh_recruitment_history_select on public.rh_recruitment_history;
create policy rh_recruitment_history_select
on public.rh_recruitment_history
for select
to authenticated
using (
  exists (
    select 1 from public.rh_recruitment_candidates c
    where c.id = candidate_id
      and (
        public.is_admin_role()
        or (public.is_rh_operator() and public.user_has_module_permission('rh', 'read'))
      )
  )
);

drop policy if exists rh_recruitment_history_insert on public.rh_recruitment_history;
create policy rh_recruitment_history_insert
on public.rh_recruitment_history
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.is_admin_role()
    or (
      public.is_rh_operator()
      and public.user_has_module_permission('rh', 'create')
    )
  )
);

drop policy if exists rh_recruitment_onboarding_select on public.rh_recruitment_onboarding;
create policy rh_recruitment_onboarding_select
on public.rh_recruitment_onboarding
for select
to authenticated
using (
  exists (
    select 1 from public.rh_recruitment_candidates c
    where c.id = candidate_id
      and (
        public.is_admin_role()
        or (public.is_rh_operator() and public.user_has_module_permission('rh', 'read'))
      )
  )
);

drop policy if exists rh_recruitment_onboarding_insert on public.rh_recruitment_onboarding;
create policy rh_recruitment_onboarding_insert
on public.rh_recruitment_onboarding
for insert
to authenticated
with check (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'create')
  )
);

drop policy if exists rh_recruitment_onboarding_update on public.rh_recruitment_onboarding;
create policy rh_recruitment_onboarding_update
on public.rh_recruitment_onboarding
for update
to authenticated
using (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
)
with check (
  public.is_admin_role()
  or (
    public.is_rh_operator()
    and public.user_has_module_permission('rh', 'update')
  )
);

create or replace function public.touch_rh_recruitment_candidates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_rh_recruitment_candidates_updated_at on public.rh_recruitment_candidates;
create trigger trg_touch_rh_recruitment_candidates_updated_at
before update on public.rh_recruitment_candidates
for each row
execute function public.touch_rh_recruitment_candidates_updated_at();

create or replace function public.touch_rh_recruitment_onboarding_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_rh_recruitment_onboarding_updated_at on public.rh_recruitment_onboarding;
create trigger trg_touch_rh_recruitment_onboarding_updated_at
before update on public.rh_recruitment_onboarding
for each row
execute function public.touch_rh_recruitment_onboarding_updated_at();

create or replace function public.sync_rh_recruitment_hire_from_approval_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate_id uuid;
  v_actor uuid;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if old.status <> 'pending' or new.status = old.status then
    return new;
  end if;
  if new.entity_type is distinct from 'rh_recruitment_hire' then
    return new;
  end if;

  begin
    v_candidate_id := new.entity_id::uuid;
  exception
    when invalid_text_representation then
      return new;
  end;

  v_actor := coalesce(new.approved_by, new.requested_by);

  if new.status = 'approved' then
    update public.rh_recruitment_candidates c
    set
      pipeline_stage = 'hired',
      hire_approval_request_id = new.id,
      updated_by = new.approved_by
    where c.id = v_candidate_id
      and c.pipeline_stage = 'pending_hire_approval';

    insert into public.rh_recruitment_history (candidate_id, event_type, event_label, payload, created_by)
    values (
      v_candidate_id,
      'hire_approval_granted',
      'Embauche approuvee',
      jsonb_build_object('approval_request_id', new.id),
      v_actor
    );

    insert into public.rh_recruitment_onboarding (candidate_id, status)
    values (v_candidate_id, 'not_started')
    on conflict (candidate_id) do nothing;

  elsif new.status = 'rejected' then
    update public.rh_recruitment_candidates c
    set
      pipeline_stage = 'offer',
      hire_approval_request_id = new.id,
      updated_by = new.requested_by
    where c.id = v_candidate_id
      and c.pipeline_stage = 'pending_hire_approval';

    insert into public.rh_recruitment_history (candidate_id, event_type, event_label, payload, created_by)
    values (
      v_candidate_id,
      'hire_approval_rejected',
      'Embauche refusee — retour etape offre',
      jsonb_build_object(
        'approval_request_id', new.id,
        'rejection_reason', new.rejection_reason
      ),
      v_actor
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_rh_recruitment_hire_from_approval on public.approval_requests;
create trigger trg_sync_rh_recruitment_hire_from_approval
after update on public.approval_requests
for each row
execute function public.sync_rh_recruitment_hire_from_approval_request();

commit;
