/** @vitest-environment happy-dom */

import { QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setStoredLocale } from "@/presentation/i18n/locale";
import { queryKeys } from "@/presentation/query/queryKeys";
import { createTestQueryClient, renderWithQuery } from "@/test/renderWithQuery";
import { DistributionNetworkList } from "./DistributionNetworkList";

const render = renderWithQuery;

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

  it("ssr stays on the loading markup when the query cache already has networks", () => {
    const client = createTestQueryClient();
    client.setQueryData(queryKeys.networks("33063"), exact);
    const html = renderToString(
      <QueryClientProvider client={client}>
        <DistributionNetworkList citycode="33063" />
      </QueryClientProvider>,
    );
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Recherche des réseaux");
    expect(html).not.toContain("PAULIN");
  });

  it("keeps the shared network and reports the commune name", async () => {
    const onSelectedCodeChange = vi.fn();
    const onCommuneLoaded = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(ambiguous)));
    render(
      <DistributionNetworkList
        citycode="33063"
        selectedCode="033001174"
        onSelectedCodeChange={onSelectedCodeChange}
        onCommuneLoaded={onCommuneLoaded}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("analyses-033001174")).toBeTruthy();
    });
    expect(onCommuneLoaded).toHaveBeenCalledWith("Bordeaux");
    expect(onSelectedCodeChange).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("writes the only residential network into the share url when none is selected", async () => {
    const onSelectedCodeChange = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          ...ambiguous,
          networks: [ambiguous.networks[0]],
        }),
      ),
    );
    render(
      <DistributionNetworkList
        citycode="31555"
        selectedCode={null}
        onSelectedCodeChange={onSelectedCodeChange}
      />,
    );
    await waitFor(() => {
      expect(onSelectedCodeChange).toHaveBeenCalledWith("033001214");
    });
    vi.unstubAllGlobals();
  });

  it("writes the exact network into the share url when none is selected", async () => {
    const onSelectedCodeChange = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(exact)));
    render(
      <DistributionNetworkList
        citycode="33009"
        selectedCode={null}
        onSelectedCodeChange={onSelectedCodeChange}
      />,
    );
    await waitFor(() => {
      expect(onSelectedCodeChange).toHaveBeenCalledWith("033001214");
    });
    vi.unstubAllGlobals();
  });

  it("clears an unknown shared network when the commune is ambiguous", async () => {
    const onSelectedCodeChange = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(ambiguous)));
    render(
      <DistributionNetworkList
        citycode="33063"
        selectedCode="099999999"
        onSelectedCodeChange={onSelectedCodeChange}
      />,
    );
    await waitFor(() => {
      expect(onSelectedCodeChange).toHaveBeenCalledWith(null);
    });
    vi.unstubAllGlobals();
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

  it("prefetches quality when a clickable network enters the viewport", async () => {
    const observers: Array<{
      callback: IntersectionObserverCallback;
      disconnect: ReturnType<typeof vi.fn>;
    }> = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        callback: IntersectionObserverCallback;
        disconnect = vi.fn();
        unobserve = vi.fn();
        observe = vi.fn();
        constructor(callback: IntersectionObserverCallback) {
          this.callback = callback;
          observers.push(this);
        }
      },
    );
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/api/networks")) {
        return Response.json(ambiguous);
      }
      return Response.json({
        networkCode: "033001214",
        windowFrom: "2025-09-02",
        source: "cache",
        latestSample: null,
        latestMeasurements: [],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DistributionNetworkList citycode="33063" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /PAULIN/ })).toBeTruthy();
    });
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).includes("/api/udi/"),
      ),
    ).toBe(false);

    act(() => {
      observers[0]?.callback(
        [
          {
            isIntersecting: true,
            target: document.createElement("button"),
          } as unknown as IntersectionObserverEntry,
        ],
        observers[0] as unknown as IntersectionObserver,
      );
    });

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).includes("/api/udi/033001214/quality"),
        ),
      ).toBe(true);
    });
  });

  it("lets the user pick and change a network when ambiguous", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(ambiguous)));
    render(<DistributionNetworkList citycode="33063" />);
    await waitFor(() => {
      expect(screen.getByText("Comment savoir quel est votre réseau ?")).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: /PAULIN/ }));
    expect(screen.getByText("analyses-033001214")).toBeTruthy();
    expect(screen.getByRole("button", { name: /CAP ROUX/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Changer de réseau/ }));
    expect(screen.queryByText("analyses-033001214")).toBeNull();
    expect(screen.getByRole("button", { name: /CAP ROUX/ })).toBeTruthy();
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

  it("shows stale networks while a refresh is in flight", async () => {
    let releaseRefresh: () => void = () => {};
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        if (String(input).includes("refresh=1")) {
          await refreshGate;
          return Response.json({
            ...exact,
            networks: [{ code: "033001214", name: "PAULIN À JOUR", neighborhoods: ["Centre"] }],
          });
        }
        return Response.json({ ...exact, stale: true });
      }),
    );

    render(<DistributionNetworkList citycode="33063" />);
    await waitFor(() => {
      expect(screen.getByText("PAULIN")).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByText("Mise à jour des réseaux…")).toBeTruthy();
    });

    releaseRefresh();
    await waitFor(() => {
      expect(screen.getByText("PAULIN À JOUR")).toBeTruthy();
    });
    expect(screen.queryByText("Mise à jour des réseaux…")).toBeNull();
  });

  it("does not start a second refresh when the first refresh stays stale", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const stale = String(input).includes("refresh=1");
      return Response.json({
        ...exact,
        stale: true,
        networks: [
          {
            code: "033001214",
            name: stale ? "PAULIN ENCORE STALE" : "PAULIN",
            neighborhoods: ["Centre"],
          },
        ],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DistributionNetworkList citycode="33063" />);
    await waitFor(() => {
      expect(screen.getByText("PAULIN ENCORE STALE")).toBeTruthy();
    });
    expect(
      fetchMock.mock.calls.filter(([input]) =>
        String(input).includes("refresh=1"),
      ),
    ).toHaveLength(1);
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
