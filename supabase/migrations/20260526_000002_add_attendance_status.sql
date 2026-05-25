alter table public.attendances
add column status text not null default 'checked_in';

alter table public.attendances
add constraint attendances_status_check
check (status in ('scheduled', 'checked_in'));
