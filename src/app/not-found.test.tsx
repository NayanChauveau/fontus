/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

describe("not-found", () => {
  it("renders a single heading and a home link", async () => {
    const { default: NotFound } = await import("./not-found");
    render(await NotFound());
    expect(
      screen.getByRole("heading", { level: 1, name: "Page introuvable" }),
    ).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("link", { name: "Retour à l’accueil" }).getAttribute("href"),
    ).toBe("/");
    expect(document.getElementById("contenu")).toBeTruthy();
  });
});
