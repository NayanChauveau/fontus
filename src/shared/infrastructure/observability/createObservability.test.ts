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

    expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
      ts: "2026-09-02T10:00:00.000Z",
      level: "error",
      scope: "analyses",
      event: "quality_unavailable",
      code: "ANALYSES_UNAVAILABLE",
      environment: "production",
      context: { networkCode: "013000577" },
      cause: { message: "timeout" },
    });

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

  it("drops an empty context and uses the event name when nothing else is set", () => {
    const lines: string[] = [];
    createObservability({ write: (line) => lines.push(line) }).report({
      level: "info",
      scope: "analyses",
      event: "cache_hit",
      context: { skip: undefined },
    });
    expect(JSON.parse(lines[0] ?? "{}")).toMatchObject({
      message: "cache_hit",
      context: null,
    });
  });
});
