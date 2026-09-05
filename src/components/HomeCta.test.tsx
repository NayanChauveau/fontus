/** @vitest-environment happy-dom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeCta } from "./HomeCta";

describe("HomeCta", () => {
  it("links back to the search tool", () => {
    render(<HomeCta label="Voir les analyses de votre commune" />);
    expect(
      screen.getByRole("link", { name: "Voir les analyses de votre commune" }).getAttribute(
        "href",
      ),
    ).toBe("/");
  });
});
