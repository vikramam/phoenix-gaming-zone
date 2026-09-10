-- Shared shop floor snapshot so every signed-in operator sees the same sessions.
-- Run once in the SQL editor after 0002.

create table if not exists shop_state (
  id text primary key default 'default' check (id = 'default'),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table shop_state enable row level security;

drop policy if exists "authenticated read write shop_state" on shop_state;
create policy "authenticated read write shop_state" on shop_state
  for all to authenticated using (true) with check (true);

grant select, insert, update on table shop_state to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shop_state'
  ) then
    alter publication supabase_realtime add table shop_state;
  end if;
end $$;
