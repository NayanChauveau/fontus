/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("@/components/AddressSearch", () => ({
  AddressSearch: () => <div>address-search</div>,
}));

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">theme-toggle</button>,
}));

describe("Home page", () => {
  it("renders the title", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(screen.getByText("address-search")).toBeTruthy();
    expect(screen.getByText("theme-toggle")).toBeTruthy();
  });
});
