-- Phoenix Gaming Zone schema for when you connect Supabase.
-- The running app currently persists in the browser so you can operate immediately.
-- Apply this in the Supabase SQL editor, then swap the local store for RPCs.

create table if not exists business_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text,
  currency_code text not null default 'INR',
  currency_symbol text not null default '₹',
  timezone text not null default 'Asia/Kolkata',
  billing_increment_minutes int not null default 30,
  minimum_duration_minutes int not null default 60,
  rounding_mode text not null default 'up',
  open_time time,
  close_time time,
  closes_next_day boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists asset_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_station boolean not null default false,
  icon_key text,
  image_path text,
  sort_order int not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  asset_type_id uuid not null references asset_types(id),
  code text not null unique,
  name text not null,
  description text,
  operational_status text not null default 'available',
  retired_at timestamptz,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  notes text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists pricing_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hourly_rate_paise bigint not null,
  status text not null default 'active',
  image_path text,
  created_at timestamptz not null default now()
);

create table if not exists pricing_package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references pricing_packages(id) on delete cascade,
  asset_type_id uuid not null references asset_types(id),
  quantity int not null check (quantity > 0),
  unique (package_id, asset_type_id)
);

create table if not exists gaming_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  walk_in_name text,
  status text not null,
  pricing_package_id uuid references pricing_packages(id),
  package_name_snapshot text not null,
  hourly_rate_paise bigint not null,
  billing_increment_minutes int not null,
  minimum_duration_minutes int not null,
  rounding_mode text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  client_request_id uuid not null unique,
  notes text,
  created_at timestamptz not null default now(),
  check (status <> 'active' or ended_at is null),
  check (customer_id is not null or length(coalesce(walk_in_name, '')) > 0)
);

create table if not exists gaming_session_assets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references gaming_sessions(id),
  asset_id uuid not null references assets(id),
  asset_type_id uuid not null,
  asset_name_snapshot text not null,
  asset_code_snapshot text not null,
  allocated_at timestamptz not null default now(),
  released_at timestamptz
);

create unique index if not exists gaming_session_assets_one_active
  on gaming_session_assets (asset_id)
  where released_at is null;

create table if not exists gaming_session_charges (
  session_id uuid primary key references gaming_sessions(id),
  package_id uuid,
  package_name text not null,
  hourly_rate_paise bigint not null,
  billing_increment_minutes int not null,
  minimum_duration_minutes int not null,
  rounding_mode text not null,
  raw_duration_seconds int not null,
  billed_duration_seconds int not null,
  computed_amount_paise bigint not null,
  override_amount_paise bigint,
  override_reason text,
  final_amount_paise bigint not null,
  payment_status text not null default 'collected',
  payment_method text,
  created_at timestamptz not null default now()
);

alter table business_settings enable row level security;
alter table asset_types enable row level security;
alter table assets enable row level security;
alter table customers enable row level security;
alter table pricing_packages enable row level security;
alter table pricing_package_items enable row level security;
alter table gaming_sessions enable row level security;
alter table gaming_session_assets enable row level security;
alter table gaming_session_charges enable row level security;

create policy "authenticated read write settings" on business_settings
  for all to authenticated using (true) with check (true);
create policy "authenticated read write asset_types" on asset_types
  for all to authenticated using (true) with check (true);
create policy "authenticated read write assets" on assets
  for all to authenticated using (true) with check (true);
create policy "authenticated read write customers" on customers
  for all to authenticated using (true) with check (true);
create policy "authenticated read write packages" on pricing_packages
  for all to authenticated using (true) with check (true);
create policy "authenticated read write package_items" on pricing_package_items
  for all to authenticated using (true) with check (true);
create policy "authenticated read write sessions" on gaming_sessions
  for all to authenticated using (true) with check (true);
create policy "authenticated read write session_assets" on gaming_session_assets
  for all to authenticated using (true) with check (true);
create policy "authenticated read write charges" on gaming_session_charges
  for all to authenticated using (true) with check (true);
