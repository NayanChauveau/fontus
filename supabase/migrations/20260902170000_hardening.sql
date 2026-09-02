create table if not exists public.rate_buckets (
  key text primary key,
  count integer not null,
  reset_at timestamptz not null
);

create table if not exists public.seen_parameter_codes (
  code text primary key,
  label text not null,
  unit text
);

alter table public.communes enable row level security;
alter table public.udis enable row level security;
alter table public.udi_commune_years enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.samples enable row level security;
alter table public.measurements enable row level security;
alter table public.parameters enable row level security;
alter table public.parameter_aliases enable row level security;
alter table public.jurisdictions enable row level security;
alter table public.threshold_versions enable row level security;
alter table public.rate_buckets enable row level security;
alter table public.seen_parameter_codes enable row level security;
