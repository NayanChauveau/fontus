create table if not exists public.samples (
  code text primary key,
  udi_code text not null references public.udis (code),
  sampled_at timestamptz not null,
  conclusion text,
  conformite_limites_bact text,
  conformite_limites_pc text,
  commune_insee text,
  source text not null
);

create table if not exists public.measurements (
  sample_code text not null references public.samples (code),
  parameter_code text not null,
  parameter_label text not null,
  raw_text text not null,
  numeric_value text,
  qualifier text not null,
  unit text,
  primary key (sample_code, parameter_code)
);

create index if not exists samples_udi_sampled_at_idx
  on public.samples (udi_code, sampled_at desc);
