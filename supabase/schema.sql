-- Run this in the Supabase SQL editor after creating the project.

create table if not exists analyses (
  id uuid primary key,
  status text not null default 'PROCESSING',
  vin text,
  detected_make text,
  detected_model text,
  detected_year int,
  vehicle_confidence numeric,
  cost_low numeric,
  cost_high numeric,
  image_urls text[],
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists parts (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references analyses(id) on delete cascade,
  position int,
  name text,
  part_type text,
  damage_type text,
  severity text,
  description text,
  confidence numeric,
  oem text,
  oem_status text default 'PENDING'
);

-- Storage: create a bucket named `car-photos` via Supabase Dashboard > Storage.
-- Set it to public (simplest for MVP) or private + signed URLs if the client
-- wants uploaded photos to stay non-public later.

-- RLS: both tables are written only via the service-role key (server-side),
-- never from the browser, so RLS can stay enabled with no public policies.
alter table analyses enable row level security;
alter table parts enable row level security;

-- Leads: captured customer contact information with vehicle & damage estimate
create table if not exists carfix_leads (
  id text primary key default gen_random_uuid()::text,
  full_name text not null,
  phone text not null,
  email text not null,
  vehicle_year int,
  vehicle_make text,
  vehicle_model text,
  vehicle_trim text,
  vehicle_body text,
  transmission text,
  fuel_type text,
  vin text,
  notes text,
  image_urls text[],
  estimated_cost_low numeric,
  estimated_cost_high numeric,
  damage_summary text,
  status text not null default 'NEW', -- NEW, CONTACTED, ESTIMATING, WON, LOST
  analysis_id text,
  internal_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_leads_status on carfix_leads(status);
create index if not exists idx_leads_created_at on carfix_leads(created_at desc);
create index if not exists idx_leads_email on carfix_leads(email);
create index if not exists idx_leads_phone on carfix_leads(phone);

alter table carfix_leads enable row level security;
