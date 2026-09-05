/** @vitest-environment happy-dom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LoadingStatus } from "./LoadingStatus";

describe("LoadingStatus", () => {
  afterEach(() => {
    cleanup();
  });

  it("announces the label as a status without a skeleton by default", () => {
    render(<LoadingStatus label="Chargement des analyses officielles…" />);
    expect(screen.getByRole("status").textContent).toContain(
      "Chargement des analyses officielles…",
    );
    expect(screen.getByRole("status").querySelector("[aria-hidden]")).toBeTruthy();
  });

  it("shows a hint and placeholder blocks when asked", () => {
    render(
      <LoadingStatus
        label="Chargement des analyses officielles…"
        hint="Cela peut prendre quelques secondes."
        skeleton
      />,
    );
    expect(
      screen.getByText("Cela peut prendre quelques secondes."),
    ).toBeTruthy();
    expect(screen.getByRole("status").querySelectorAll("[aria-hidden]")).toHaveLength(
      2,
    );
  });
});
