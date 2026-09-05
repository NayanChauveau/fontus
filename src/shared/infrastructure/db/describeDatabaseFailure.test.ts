import { describe, expect, it } from "vitest";
import { describeDatabaseFailure } from "./describeDatabaseFailure";

function errorWithCode(message: string, code: string) {
  const error = new Error(message) as Error & { code: string };
  error.code = code;
  return error;
}

describe("describeDatabaseFailure", () => {
  it("reads a Drizzle-wrapped missing table from the cause chain", () => {
    const inner = errorWithCode('relation "sync_jobs" does not exist', "42P01");
    const outer = new Error(
      'Failed query: select "scope" from "sync_jobs" where "sync_jobs"."scope" = $1',
      { cause: inner },
    );
    expect(describeDatabaseFailure(outer)).toEqual({
      code: "schema_missing",
      detail:
        "Table sync_jobs is missing. Postgres answers but migrations were not applied.",
    });
  });

  it("stops a circular cause chain", () => {
    const loop = new Error("loop");
    loop.cause = loop;
    expect(describeDatabaseFailure(loop)).toBeNull();
  });

  it("explains a missing relation", () => {
    expect(
      describeDatabaseFailure(
        errorWithCode('relation "udis" does not exist', "42P01"),
      ),
    ).toEqual({
      code: "schema_missing",
      detail:
        "Table udis is missing. Postgres answers but migrations were not applied.",
    });
    expect(
      describeDatabaseFailure('relation "sync_jobs" does not exist'),
    ).toMatchObject({ code: "schema_missing" });
  });

  it("explains auth, missing database, and connection errors", () => {
    expect(
      describeDatabaseFailure(errorWithCode("password authentication failed", "28P01")),
    ).toMatchObject({ code: "postgres_auth_failed" });
    expect(
      describeDatabaseFailure('database "fontus" does not exist'),
    ).toEqual({
      code: "database_missing",
      detail: 'Database fontus does not exist.',
    });
    expect(
      describeDatabaseFailure(errorWithCode("connect ECONNREFUSED", "ECONNREFUSED")),
    ).toMatchObject({ code: "postgres_refused" });
    expect(
      describeDatabaseFailure(errorWithCode("getaddrinfo ENOTFOUND postgres", "ENOTFOUND")),
    ).toMatchObject({ code: "postgres_host_not_found" });
    expect(
      describeDatabaseFailure(errorWithCode("connect ETIMEDOUT", "ETIMEDOUT")),
    ).toMatchObject({ code: "postgres_timeout" });
  });

  it("covers postgres codes without a parseable name", () => {
    expect(
      describeDatabaseFailure(errorWithCode("undefined_table", "42P01")),
    ).toEqual({
      code: "schema_missing",
      detail:
        "Table unknown is missing. Postgres answers but migrations were not applied.",
    });
    expect(
      describeDatabaseFailure(errorWithCode("invalid_catalog_name", "3D000")),
    ).toEqual({
      code: "database_missing",
      detail: "Database unknown does not exist.",
    });
    expect(
      describeDatabaseFailure("password authentication failed for user postgres"),
    ).toMatchObject({ code: "postgres_auth_failed" });
    expect(
      describeDatabaseFailure(errorWithCode("getaddrinfo EAI_AGAIN", "EAI_AGAIN")),
    ).toMatchObject({ code: "postgres_host_not_found" });
    expect(
      describeDatabaseFailure(errorWithCode("the database system is starting up", "57P03")),
    ).toMatchObject({ code: "postgres_timeout" });
    expect(
      describeDatabaseFailure({ message: 'relation "samples" does not exist' }),
    ).toMatchObject({ code: "schema_missing", detail: expect.stringContaining("samples") });
  });

  it("returns null when the cause is not a known database failure", () => {
    expect(describeDatabaseFailure(new Error("timeout from HubEau"))).toBeNull();
    expect(describeDatabaseFailure(null)).toBeNull();
    expect(describeDatabaseFailure("")).toBeNull();
    expect(describeDatabaseFailure({ nope: true })).toBeNull();
    expect(describeDatabaseFailure({ message: 12 })).toBeNull();
    const numbered = new Error("weird") as Error & { code: number };
    numbered.code = 42;
    expect(describeDatabaseFailure(numbered)).toBeNull();
  });
});
