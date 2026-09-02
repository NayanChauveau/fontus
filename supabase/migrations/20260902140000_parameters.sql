create table if not exists public.parameters (
  id text primary key,
  name text not null,
  cas text,
  category text not null,
  canonical_unit text,
  display_priority integer not null,
  origin text not null
);

create table if not exists public.parameter_aliases (
  source text not null,
  external_code text not null,
  label text,
  parameter_id text not null references public.parameters (id),
  primary key (source, external_code)
);

create index if not exists parameter_aliases_code_idx
  on public.parameter_aliases (external_code);
