create table if not exists public.communes (
  insee text primary key,
  name text not null
);

create table if not exists public.udis (
  code text primary key,
  name text not null
);

create table if not exists public.udi_commune_years (
  commune_insee text not null references public.communes (insee),
  udi_code text not null references public.udis (code),
  year integer not null,
  neighborhood text,
  supply_started_on date,
  primary key (commune_insee, udi_code, year)
);

create table if not exists public.sync_jobs (
  scope text primary key,
  fetched_at timestamptz not null,
  window_from date,
  status text not null
);

create index if not exists udi_commune_years_commune_year_idx
  on public.udi_commune_years (commune_insee, year);
