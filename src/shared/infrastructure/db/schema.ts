import {
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
