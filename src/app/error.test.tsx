/** @vitest-environment happy-dom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

describe("app error boundary", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("reports the render error and can retry", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const reset = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "d1" });

    render(<ErrorPage error={error} reset={reset} />);
    expect(screen.getByText(/erreur inattendue/)).toBeTruthy();
    screen.getByRole("button", { name: "Réessayer" }).click();
    expect(reset).toHaveBeenCalled();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/errors",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});
