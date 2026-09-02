import {
  boolean,
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const communes = pgTable("communes", {
  insee: text("insee").primaryKey(),
  name: text("name").notNull(),
});

export const udis = pgTable("udis", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
});

export const udiCommuneYears = pgTable(
  "udi_commune_years",
  {
    communeInsee: text("commune_insee")
      .notNull()
      .references(() => communes.insee),
    udiCode: text("udi_code")
      .notNull()
      .references(() => udis.code),
    year: integer("year").notNull(),
    neighborhood: text("neighborhood"),
    supplyStartedOn: date("supply_started_on"),
  },
  (table) => [
    primaryKey({
      columns: [table.communeInsee, table.udiCode, table.year],
    }),
  ],
);

export const syncJobs = pgTable("sync_jobs", {
  scope: text("scope").primaryKey(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  windowFrom: date("window_from"),
  status: text("status").notNull(),
});

export const samples = pgTable("samples", {
  code: text("code").primaryKey(),
  udiCode: text("udi_code")
    .notNull()
    .references(() => udis.code),
  sampledAt: timestamp("sampled_at", { withTimezone: true }).notNull(),
  conclusion: text("conclusion"),
  conformiteLimitesBact: text("conformite_limites_bact"),
  conformiteLimitesPc: text("conformite_limites_pc"),
  communeInsee: text("commune_insee"),
  source: text("source").notNull(),
});

export const parameters = pgTable("parameters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cas: text("cas"),
  category: text("category").notNull(),
  canonicalUnit: text("canonical_unit"),
  displayPriority: integer("display_priority").notNull(),
  origin: text("origin").notNull(),
});

export const parameterAliases = pgTable(
  "parameter_aliases",
  {
    source: text("source").notNull(),
    externalCode: text("external_code").notNull(),
    label: text("label"),
    parameterId: text("parameter_id")
      .notNull()
      .references(() => parameters.id),
  },
  (table) => [primaryKey({ columns: [table.source, table.externalCode] })],
);

export const measurements = pgTable(
  "measurements",
  {
    sampleCode: text("sample_code")
      .notNull()
      .references(() => samples.code),
    parameterCode: text("parameter_code").notNull(),
    parameterLabel: text("parameter_label").notNull(),
    rawText: text("raw_text").notNull(),
    numericValue: text("numeric_value"),
    qualifier: text("qualifier").notNull(),
    unit: text("unit"),
  },
  (table) => [
    primaryKey({ columns: [table.sampleCode, table.parameterCode] }),
  ],
);

export const jurisdictions = pgTable("jurisdictions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const rateBuckets = pgTable("rate_buckets", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});

export const seenParameterCodes = pgTable("seen_parameter_codes", {
  code: text("code").primaryKey(),
  label: text("label").notNull(),
  unit: text("unit"),
});

export const thresholdVersions = pgTable("threshold_versions", {
  id: text("id").primaryKey(),
  parameterId: text("parameter_id").notNull(),
  jurisdiction: text("jurisdiction")
    .notNull()
    .references(() => jurisdictions.id),
  unit: text("unit").notNull(),
  value: text("value").notNull(),
  valueMax: text("value_max"),
  operator: text("operator").notNull(),
  kind: text("kind").notNull(),
  binding: boolean("binding").notNull(),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to"),
  citation: text("citation").notNull(),
  sourceUrl: text("source_url").notNull(),
});
