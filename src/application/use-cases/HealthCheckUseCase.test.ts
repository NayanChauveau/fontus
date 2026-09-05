import { describe, expect, it } from "vitest";
import { createFakeApplicationPorts } from "../ports/testing/createFakeApplicationPorts";
import { HealthCheckUseCase } from "./HealthCheckUseCase";

describe("HealthCheckUseCase", () => {
  it("returns ok when postgres and schema answer", async () => {
    const { ports } = createFakeApplicationPorts();
    const result = await new HealthCheckUseCase(ports).execute();

    expect(result).toEqual({
      status: "ok",
      postgres: true,
      schema: true,
      detail: null,
      checkedAt: "2026-09-02T08:00:00.000Z",
    });
  });

  it("returns error when postgres is down", async () => {
    const reported: string[] = [];
    const { ports } = createFakeApplicationPorts({
      health: {
        async ping() {
          return {
            ok: false,
            postgres: false,
            schema: false,
            detail: "Postgres refused the connection. Is the postgres service up?",
            at: new Date("2026-09-02T08:00:00.000Z"),
          };
        },
      },
      observability: {
        report(event) {
          reported.push(event.event);
        },
      },
    });

    const result = await new HealthCheckUseCase(ports).execute();
    expect(result.status).toBe("error");
    expect(result.postgres).toBe(false);
    expect(result.schema).toBe(false);
    expect(result.detail).toContain("refused");
    expect(reported).toEqual(["postgres_unhealthy"]);
  });

  it("returns error when tables are missing", async () => {
    const reported: Array<{ event: string; code?: string }> = [];
    const { ports } = createFakeApplicationPorts({
      health: {
        async ping() {
          return {
            ok: false,
            postgres: true,
            schema: false,
            detail:
              "Table udis is missing. Postgres answers but migrations were not applied.",
            at: new Date("2026-09-02T08:00:00.000Z"),
          };
        },
      },
      observability: {
        report(event) {
          reported.push({ event: event.event, code: event.code });
        },
      },
    });

    const result = await new HealthCheckUseCase(ports).execute();
    expect(result).toMatchObject({
      status: "error",
      postgres: true,
      schema: false,
    });
    expect(result.detail).toContain("udis");
    expect(reported).toEqual([
      { event: "schema_missing", code: "schema_missing" },
    ]);
  });

  it("returns error when the health port throws", async () => {
    const reported: string[] = [];
    const { ports } = createFakeApplicationPorts({
      health: {
        async ping() {
          throw new Error("connection refused");
        },
      },
      observability: {
        report(event) {
          reported.push(event.event);
        },
      },
    });

    const result = await new HealthCheckUseCase(ports).execute();

    expect(result.status).toBe("error");
    expect(result.postgres).toBe(false);
    expect(result.schema).toBe(false);
    expect(result.detail).toBe("connection refused");
    expect(result.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(reported).toEqual(["postgres_unreachable"]);
  });

  it("uses a fallback detail when the thrown cause is not an Error", async () => {
    const { ports } = createFakeApplicationPorts({
      health: {
        async ping() {
          throw "down";
        },
      },
    });

    const result = await new HealthCheckUseCase(ports).execute();
    expect(result.detail).toBe("Postgres did not answer.");
  });
});
