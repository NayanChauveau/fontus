import { describe, expect, it } from "vitest";
import { createObservability } from "./createObservability";

describe("createObservability", () => {
  it("writes JSON in production shape and a readable local dump", () => {
    const lines: string[] = [];
    const json = createObservability({
      write: (line) => lines.push(line),
      now: () => new Date("2026-09-02T10:00:00.000Z"),
      environment: "production",
    });
    json.report({
      level: "error",
      scope: "analyses",
      event: "quality_unavailable",
      code: "ANALYSES_UNAVAILABLE",
      cause: new Error("timeout"),
      context: { networkCode: "013000577", unused: undefined },
    });

    const line = JSON.parse(lines[0] ?? "{}");
    expect(line).toMatchObject({
      level: "error",
      time: "2026-09-02T10:00:00.000Z",
      service: "fontus",
      msg: "analyses.quality_unavailable",
      err: { type: "Error", message: "timeout" },
      scope: "analyses",
      event: "quality_unavailable",
      code: "ANALYSES_UNAVAILABLE",
      environment: "production",
      context: { networkCode: "013000577" },
    });
    // Same keys as manon-karsenti's pino logger; the legacy Fontus keys are gone.
    expect(Object.keys(line).slice(0, 4)).toEqual([
      "level",
      "time",
      "service",
      "msg",
    ]);
    for (const legacy of ["ts", "message", "cause"]) {
      expect(line).not.toHaveProperty(legacy);
    }

    const pretty = createObservability({
      write: (line) => lines.push(line),
      pretty: true,
    });
    pretty.report({
      level: "warn",
      scope: "health",
      event: "postgres_unhealthy",
      cause: new Error("down"),
      context: { postgres: false },
    });
    expect(lines.at(-1)).toContain("[warn] health.postgres_unhealthy");
    expect(lines.at(-1)).toContain("postgres");
  });

  it("explains a missing schema instead of the raw postgres error", () => {
    const lines: string[] = [];
    const error = new Error('relation "udis" does not exist') as Error & {
      code: string;
    };
    error.code = "42P01";
    createObservability({
      write: (line) => lines.push(line),
      pretty: true,
    }).report({
      level: "error",
      scope: "analyses",
      event: "cache_read_failed",
      cause: error,
      context: { networkCode: "081004110" },
    });

    expect(lines.at(-1)).toContain("cache_read_failed schema_missing");
    expect(lines.at(-1)).toContain(
      "Table udis is missing. Postgres answers but migrations were not applied.",
    );

    const jsonLines: string[] = [];
    createObservability({
      write: (line) => jsonLines.push(line),
    }).report({
      level: "error",
      scope: "analyses",
      event: "cache_read_failed",
      cause: error,
    });
    expect(JSON.parse(jsonLines[0] ?? "{}")).toMatchObject({
      code: "schema_missing",
      msg: "Table udis is missing. Postgres answers but migrations were not applied.",
      err: { message: 'relation "udis" does not exist' },
    });

    const wrappedLines: string[] = [];
    const inner = new Error('relation "sync_jobs" does not exist') as Error & {
      code: string;
    };
    inner.code = "42P01";
    createObservability({
      write: (line) => wrappedLines.push(line),
    }).report({
      level: "error",
      scope: "analyses",
      event: "cache_read_failed",
      cause: new Error('Failed query: select "scope" from "sync_jobs"', {
        cause: inner,
      }),
    });
    expect(JSON.parse(wrappedLines[0] ?? "{}")).toMatchObject({
      code: "schema_missing",
      msg: "Table sync_jobs is missing. Postgres answers but migrations were not applied.",
      err: {
        message: 'Failed query: select "scope" from "sync_jobs"',
        chain: [
          'Failed query: select "scope" from "sync_jobs"',
          'relation "sync_jobs" does not exist',
        ],
      },
    });
  });

  it("drops an empty context and uses the event name when nothing else is set", () => {
    const lines: string[] = [];
    createObservability({ write: (line) => lines.push(line) }).report({
      level: "info",
      scope: "analyses",
      event: "cache_hit",
      context: { skip: undefined },
    });
    const line = JSON.parse(lines[0] ?? "{}");
    expect(line).toMatchObject({
      level: "info",
      msg: "analyses.cache_hit",
      context: null,
    });
    expect(line).not.toHaveProperty("err");
  });

  it("describes a cause that is not an Error", () => {
    const lines: string[] = [];
    createObservability({ write: (line) => lines.push(line) }).report({
      level: "warn",
      scope: "ui",
      event: "client_error",
      cause: "boom",
    });
    expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
      level: "warn",
      msg: "ui.client_error",
      err: { type: "string", message: "boom", stack: null },
    });
  });

  it("keeps the stack trace and the service name in production JSON", () => {
    const lines: string[] = [];
    const json = createObservability({
      write: (line) => lines.push(line),
      environment: "production",
    });
    json.report({
      level: "error",
      scope: "http",
      event: "request_failed",
      cause: new Error("boom"),
    });
    const parsed = JSON.parse(lines[0] ?? "{}");
    expect(parsed.service).toBe("fontus");
    expect(parsed.err.type).toBe("Error");
    expect(parsed.err.stack).toContain("Error: boom");
    expect(parsed.err.stack).toContain("createObservability.test.ts");
    expect(lines[0]).not.toContain("\n    at ");
  });
});
