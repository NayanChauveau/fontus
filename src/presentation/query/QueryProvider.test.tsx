/** @vitest-environment happy-dom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QueryProvider } from "./QueryProvider";

describe("QueryProvider", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("renders children", () => {
    render(
      <QueryProvider>
        <p>ready</p>
      </QueryProvider>,
    );
    expect(screen.getByText("ready")).toBeTruthy();
  });
});
