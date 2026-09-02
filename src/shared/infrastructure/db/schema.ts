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
