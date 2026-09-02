import { describe, expect, it, vi } from "vitest";
import { resetApplicationBinding } from "@/application/getApplication";

vi.mock("@/shared/infrastructure/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => [] }),
      }),
    }),
    execute: async () => [{ "?column?": 1 }],
  }),
}));

describe("createApp", () => {
  it("initializes the application singleton", async () => {
    resetApplicationBinding();
    const { createApp } = await import("./createApp");
    const { application } = createApp();
    expect(application.healthCheckUseCase).toBeDefined();
    const { getApplication } = await import("@/application/getApplication");
    expect(getApplication()).toBe(application);
    resetApplicationBinding();
  });
});
