-- Operator roles for Supabase Auth users.
-- Run this in the SQL editor after 0001. Existing Auth users are backfilled:
-- the oldest account becomes admin, the rest become employee.
-- Change a role later in Table Editor → operator_profiles.

create table if not exists operator_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'employee' check (role in ('admin', 'employee')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table operator_profiles enable row level security;

drop policy if exists "operators read own profile" on operator_profiles;
create policy "operators read own profile" on operator_profiles
  for select to authenticated using (auth.uid() = id);

grant select on table operator_profiles to authenticated;

create or replace function public.handle_new_operator()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.operator_profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'operator'), '@', 1)),
    coalesce(nullif(new.raw_app_meta_data->>'role', ''), 'employee')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_operator();

insert into public.operator_profiles (id, email, name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'name', split_part(coalesce(u.email, 'operator'), '@', 1)),
  case
    when u.id = (select id from auth.users order by created_at asc, id asc limit 1)
      then 'admin'
    else 'employee'
  end
from auth.users u
on conflict (id) do nothing;
