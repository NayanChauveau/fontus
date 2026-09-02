create table if not exists public.jurisdictions (
  id text primary key,
  name text not null
);

create table if not exists public.threshold_versions (
  id text primary key,
  parameter_id text not null,
  jurisdiction text not null references public.jurisdictions (id),
  unit text not null,
  value text not null,
  value_max text,
  operator text not null,
  kind text not null,
  binding boolean not null,
  valid_from date not null,
  valid_to date,
  citation text not null,
  source_url text not null
);

create index if not exists threshold_versions_parameter_idx
  on public.threshold_versions (parameter_id, jurisdiction, valid_from);
