/** @vitest-environment happy-dom */

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setStoredLocale } from "@/presentation/i18n/locale";
import { DistributionNetworkList } from "./DistributionNetworkList";

vi.mock("./NetworkAnalyses", () => ({
  NetworkAnalyses: ({ networkCode }: { networkCode: string }) => (
    <div>analyses-{networkCode}</div>
  ),
}));

const ambiguous = {
  citycode: "33063",
  city: "Bordeaux",
  year: 2026,
  confidence: "ambiguous",
  networks: [
    { code: "033001214", name: "PAULIN", neighborhoods: ["Centre"] },
    { code: "033001174", name: "CAP ROUX", neighborhoods: ["Ouest"] },
  ],
  hiddenNonResidentialCount: 2,
  selectedNetworkCode: null,
  source: "cache",
};

const exact = {
  ...ambiguous,
  confidence: "exact",
  networks: [ambiguous.networks[0]],
  hiddenNonResidentialCount: 0,
};

describe("DistributionNetworkList", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    document.documentElement.lang = "fr";
  });

  it("auto-selects the only network when confidence is exact", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(exact)));
    render(<DistributionNetworkList citycode="33009" />);
    expect(screen.getByText(/Recherche des réseaux/)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("PAULIN")).toBeTruthy();
    });
    expect(screen.getByText("analyses-033001214")).toBeTruthy();
  });

  it("does not auto-select when the exact network has no code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          ...exact,
          networks: [{ name: "PAULIN", neighborhoods: [] }],
        }),
      ),
    );
    render(<DistributionNetworkList citycode="33009" />);
    await waitFor(() => {
      expect(screen.getByText("PAULIN")).toBeTruthy();
    });
    expect(screen.queryByText(/analyses-/)).toBeNull();
  });

  it("omits the year when Hub’Eau does not provide one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ...exact, year: 0 })),
    );
    render(<DistributionNetworkList citycode="33009" />);
    await waitFor(() => {
      expect(screen.getByText("PAULIN")).toBeTruthy();
    });
    expect(screen.queryByText(/Année/)).toBeNull();
  });

  it("lets the user pick and change a network when ambiguous", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(ambiguous)));
    render(<DistributionNetworkList citycode="33063" />);
    await waitFor(() => {
      expect(screen.getByText("Comment savoir quel est votre réseau ?")).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: /PAULIN/ }));
    expect(screen.getByText("analyses-033001214")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Changer de réseau/ }));
    expect(screen.queryByText("analyses-033001214")).toBeNull();
    vi.unstubAllGlobals();
  });

  it("shows unavailable on error or empty list", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "x" }, { status: 503 })));
    const first = render(<DistributionNetworkList citycode="33063" />);
    await waitFor(() => {
      expect(screen.getByText(/Impossible de charger/)).toBeTruthy();
    });
    first.unmount();

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ ...ambiguous, networks: [] })));
    const second = render(<DistributionNetworkList citycode="33064" />);
    await waitFor(() => {
      expect(screen.getByText(/Impossible de charger/)).toBeTruthy();
    });
    second.unmount();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    render(<DistributionNetworkList citycode="33065" />);
    await waitFor(() => {
      expect(screen.getByText(/Impossible de charger/)).toBeTruthy();
    });
    vi.unstubAllGlobals();
  });

  it("retries the request from the unavailable state", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ error: "x" }, { status: 503 }))
      .mockResolvedValueOnce(Response.json(exact));
    vi.stubGlobal("fetch", fetchMock);
    render(<DistributionNetworkList citycode="33063" />);
    await waitFor(() => {
      expect(screen.getByText(/Impossible de charger/)).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    await waitFor(() => {
      expect(screen.getByText("PAULIN")).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });

  it("ignores abort errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("aborted", "AbortError");
      }),
    );
    render(<DistributionNetworkList citycode="33063" />);
    await waitFor(() => {
      expect(screen.getByText(/Recherche des réseaux/)).toBeTruthy();
    });
    vi.unstubAllGlobals();
  });

  it("remaps copy on locale switch without refetch", async () => {
    const fetchMock = vi.fn(async () => Response.json(ambiguous));
    vi.stubGlobal("fetch", fetchMock);
    render(<DistributionNetworkList citycode="33063" />);
    await waitFor(() => {
      expect(screen.getByText("Réseaux de distribution")).toBeTruthy();
    });
    act(() => {
      setStoredLocale("en");
    });
    expect(screen.getByText("Distribution networks")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
