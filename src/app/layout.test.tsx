/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "./layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "geist" }),
  Geist_Mono: () => ({ variable: "geist-mono" }),
}));

describe("RootLayout", () => {
  it("wraps children in a french document", () => {
    render(
      <RootLayout params={Promise.resolve({})}>
        <div>child</div>
      </RootLayout>,
    );
    expect(screen.getByText("child")).toBeTruthy();
    expect(document.documentElement.lang).toBe("fr");
    expect(document.head.textContent).toContain("eau-robinet-theme");
  });
});
