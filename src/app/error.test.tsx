/** @vitest-environment happy-dom */

import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setStoredLocale } from "@/presentation/i18n/locale";
import ErrorPage from "./error";

describe("app error boundary", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    document.documentElement.lang = "fr";
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

  it("remaps copy on locale switch without refetch", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <ErrorPage
        error={Object.assign(new Error("boom"), { digest: "d1" })}
        reset={() => {}}
      />,
    );
    expect(screen.getByText(/erreur inattendue/)).toBeTruthy();
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    act(() => {
      setStoredLocale("en");
    });
    expect(screen.getByText("An unexpected error occurred.")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
