import { describe, expect, it } from "vitest";
import { createFakeApplicationPorts } from "../ports/testing/createFakeApplicationPorts";
import { HealthCheckUseCase } from "./HealthCheckUseCase";

describe("HealthCheckUseCase", () => {
  it("returns ok when postgres answers", async () => {
    const { ports } = createFakeApplicationPorts();
    const result = await new HealthCheckUseCase(ports).execute();

    expect(result).toEqual({
      status: "ok",
      postgres: true,
      checkedAt: "2026-09-02T08:00:00.000Z",
    });
  });

  it("returns error when ping is not ok", async () => {
    const reported: string[] = [];
    const { ports } = createFakeApplicationPorts({
      health: {
        async ping() {
          return { ok: false, at: new Date("2026-09-02T08:00:00.000Z") };
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
    expect(reported).toEqual(["postgres_unhealthy"]);
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
    expect(result.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(reported).toEqual(["postgres_unreachable"]);
  });
});
