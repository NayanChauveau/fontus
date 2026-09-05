import { beforeEach, describe, expect, it, vi } from "vitest";

const execute = vi.fn();

vi.mock("@/shared/infrastructure/db/client", () => ({
  getDb: () => ({ execute }),
}));

describe("createHealthPortAdapter", () => {
  beforeEach(() => {
    execute.mockReset();
  });

  it("pings postgres and checks a required table", async () => {
    execute.mockResolvedValue([{ "?column?": 1 }]);
    const { createHealthPortAdapter } = await import("./createHealthPortAdapter");
    const ping = await createHealthPortAdapter().ping();
    expect(ping).toMatchObject({
      ok: true,
      postgres: true,
      schema: true,
      detail: null,
    });
    expect(ping.at).toBeInstanceOf(Date);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("reports a refused connection without checking the schema", async () => {
    const error = new Error("connect ECONNREFUSED 172.18.0.2:5432") as Error & {
      code: string;
    };
    error.code = "ECONNREFUSED";
    execute.mockRejectedValueOnce(error);
    const { createHealthPortAdapter } = await import("./createHealthPortAdapter");
    await expect(createHealthPortAdapter().ping()).resolves.toMatchObject({
      ok: false,
      postgres: false,
      schema: false,
      detail: "Postgres refused the connection. Is the postgres service up?",
    });
    expect(execute).toHaveBeenCalledOnce();
  });

  it("reports missing migrations when postgres answers", async () => {
    const error = new Error('relation "udis" does not exist') as Error & {
      code: string;
    };
    error.code = "42P01";
    execute.mockResolvedValueOnce([{ "?column?": 1 }]).mockRejectedValueOnce(error);
    const { createHealthPortAdapter } = await import("./createHealthPortAdapter");
    await expect(createHealthPortAdapter().ping()).resolves.toMatchObject({
      ok: false,
      postgres: true,
      schema: false,
      detail:
        "Table udis is missing. Postgres answers but migrations were not applied.",
    });
  });

  it("falls back when the error is not classified", async () => {
    execute.mockRejectedValueOnce(new Error("disk full"));
    const { createHealthPortAdapter } = await import("./createHealthPortAdapter");
    await expect(createHealthPortAdapter().ping()).resolves.toMatchObject({
      ok: false,
      postgres: false,
      detail: "Postgres did not answer.",
    });

    execute.mockResolvedValueOnce([{ "?column?": 1 }]).mockRejectedValueOnce("boom");
    await expect(createHealthPortAdapter().ping()).resolves.toMatchObject({
      ok: false,
      postgres: true,
      schema: false,
      detail: "Required tables are missing. Migrations were not applied.",
    });
  });
});
