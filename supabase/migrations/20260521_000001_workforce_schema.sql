create extension if not exists "pgcrypto";

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  work_date date not null,
  created_at timestamptz not null default now(),
  unique (worker_id, work_date)
);

create table public.task_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  task_type_id uuid not null references public.task_types(id) on delete restrict,
  work_date date not null,
  source text not null default 'excel_upload',
  created_at timestamptz not null default now(),
  unique (worker_id, work_date)
);

create table public.worker_skills (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  task_type_id uuid not null references public.task_types(id) on delete restrict,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default now(),
  unique (worker_id, task_type_id)
);

alter table public.workers enable row level security;
alter table public.attendances enable row level security;
alter table public.task_types enable row level security;
alter table public.assignments enable row level security;
alter table public.worker_skills enable row level security;

create policy "authenticated full access workers"
on public.workers
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access attendances"
on public.attendances
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access task_types"
on public.task_types
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access assignments"
on public.assignments
for all
to authenticated
using (true)
with check (true);

create policy "authenticated full access worker_skills"
on public.worker_skills
for all
to authenticated
using (true)
with check (true);

create or replace function public.apply_assignment_batch(
  p_work_date date,
  p_rows jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  row_record jsonb;
  v_worker_id uuid;
  v_task_type_id uuid;
begin
  for row_record in select * from jsonb_array_elements(p_rows)
  loop
    v_worker_id := (row_record ->> 'worker_id')::uuid;
    v_task_type_id := (row_record ->> 'task_type_id')::uuid;

    insert into public.assignments (worker_id, task_type_id, work_date, source)
    values (v_worker_id, v_task_type_id, p_work_date, 'excel_upload');

    insert into public.worker_skills (worker_id, task_type_id, count)
    values (v_worker_id, v_task_type_id, 1)
    on conflict (worker_id, task_type_id)
    do update
      set count = public.worker_skills.count + 1,
          updated_at = now();
  end loop;
end;
$$;

revoke all on function public.apply_assignment_batch(date, jsonb) from public;
grant execute on function public.apply_assignment_batch(date, jsonb) to authenticated;
