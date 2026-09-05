/** @vitest-environment happy-dom */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddressSearch } from "./AddressSearch";

const share = {
  citycode: null as string | null,
  networkCode: null as string | null,
  replaceShare: vi.fn(),
};

vi.mock("./useShareUrl", () => ({
  useShareUrl: () => ({
    citycode: share.citycode,
    networkCode: share.networkCode,
    replaceShare: share.replaceShare,
  }),
}));

vi.mock("./DistributionNetworkList", () => ({
  DistributionNetworkList: ({
    citycode,
    selectedCode,
    onSelectedCodeChange,
    onCommuneLoaded,
  }: {
    citycode: string;
    selectedCode?: string | null;
    onSelectedCodeChange?: (code: string | null) => void;
    onCommuneLoaded?: (city: string) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onCommuneLoaded?.("Bordeaux")}>
        hydrate-city
      </button>
      <button
        type="button"
        onClick={() => onSelectedCodeChange?.("033001214")}
      >
        pick-network
      </button>
      networks-{citycode}
      {selectedCode ? `-${selectedCode}` : ""}
    </div>
  ),
}));

const suggestion = {
  id: "id-1",
  label: "12 Rue Sainte-Catherine 33000 Bordeaux",
  city: "Bordeaux",
  citycode: "33063",
  longitude: -0.57,
  latitude: 44.84,
};

describe("AddressSearch", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    share.citycode = null;
    share.networkCode = null;
    share.replaceShare.mockReset();
  });

  it("searches, selects and clears an address without resolving", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/suggest")) {
        return Response.json({ suggestions: [suggestion] });
      }
      return Response.json({
        address: { ...suggestion, latitude: 44.841405, longitude: -0.574364 },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AddressSearch />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "ab" } });
    fireEvent.change(input, { target: { value: "12 rue Sainte-Catherine" } });

    await waitFor(() => {
      expect(screen.getByRole("option")).toBeTruthy();
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Adresse retenue")).toBeTruthy();
    });
    expect(screen.getByText("networks-33063")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Changer d’adresse/ }));
    expect(screen.queryByText("Adresse retenue")).toBeNull();
    expect(share.replaceShare).toHaveBeenCalledWith({
      citycode: null,
      networkCode: null,
    });
  });

  it("handles empty results, service errors and keyboard extras", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("empty")) {
        return Response.json({ suggestions: [] });
      }
      if (url.includes("fail")) {
        return Response.json({ error: "GEOCODING_UNAVAILABLE" }, { status: 503 });
      }
      return Response.json({ suggestions: [suggestion, { ...suggestion, id: "id-2" }] });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(<AddressSearch />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "empty query here" } });
    await waitFor(() => {
      expect(screen.getByText("Aucune adresse trouvée.")).toBeTruthy();
    });

    fireEvent.change(input, { target: { value: "fail query here" } });
    await waitFor(() => {
      expect(screen.getByText(/indisponible/)).toBeTruthy();
    });

    fireEvent.change(input, { target: { value: "12 rue Sainte-Catherine" } });
    await waitFor(() => {
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
    });
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.change(input, { target: { value: "12 rue Sainte-Catherine+" } });
    await waitFor(() => {
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
    });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.mouseEnter(screen.getAllByRole("option", { name: /12 Rue Sainte-Catherine/ })[0]!);
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(screen.getByText("Adresse retenue")).toBeTruthy();
    });
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.keyDown(input, { key: "Enter" });

    unmount();
    cleanup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    render(<AddressSearch />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "12 rue offline" },
    });
    await waitFor(() => {
      expect(screen.getByText(/indisponible/)).toBeTruthy();
    });
  });

  it("selects a suggestion without calling resolve", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/suggest")) {
        return Response.json({ suggestions: [suggestion] });
      }
      throw new Error("resolve should not be called");
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AddressSearch />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "12 rue Sainte-Catherine" },
    });
    await waitFor(() => {
      expect(screen.getByRole("option")).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("option", { name: /12 Rue Sainte-Catherine/ }));
    expect(screen.getByText("Adresse retenue")).toBeTruthy();
    expect(
      fetchMock.mock.calls.every(
        (call) => !String(call[0]).includes("/resolve"),
      ),
    ).toBe(true);
    expect(screen.getByText("networks-33063")).toBeTruthy();
  });

  it("ignores an aborted suggest after a first successful search", async () => {
    let suggestCalls = 0;
    const fetchMock = vi.fn((input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/suggest")) {
        suggestCalls += 1;
        if (suggestCalls === 1) {
          return Promise.resolve(Response.json({ suggestions: [suggestion] }));
        }
        return new Promise<Response>((_resolve, reject) => {
          const fail = () => {
            reject(new DOMException("aborted", "AbortError"));
          };
          if (init?.signal?.aborted) {
            fail();
            return;
          }
          init?.signal?.addEventListener("abort", fail);
        });
      }
      return Promise.resolve(Response.json({ address: null }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const { unmount } = render(<AddressSearch />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "12 rue Sainte-Catherine" } });
    await waitFor(() => {
      expect(screen.getByRole("option")).toBeTruthy();
    });
    fireEvent.change(input, { target: { value: "12 rue abort-two" } });
    await waitFor(() => {
      expect(screen.getByText(/Recherche/)).toBeTruthy();
    });
    unmount();
  });

  it("shows networks as soon as a suggestion is selected", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ suggestions: [suggestion] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<AddressSearch />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "12 rue Sainte-Catherine" },
    });
    await waitFor(() => {
      expect(screen.getByRole("option")).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("option", { name: /12 Rue Sainte-Catherine/ }));
    expect(screen.getByText("Adresse retenue")).toBeTruthy();
    expect(screen.getByText("networks-33063")).toBeTruthy();
    expect(share.replaceShare).toHaveBeenCalledWith({
      citycode: "33063",
      networkCode: null,
    });
  });

  it("restores a commune and network from the share url", () => {
    share.citycode = "33063";
    share.networkCode = "033001214";
    render(<AddressSearch />);
    expect(screen.getByText("Adresse retenue")).toBeTruthy();
    expect(screen.getByText("networks-33063-033001214")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "hydrate-city" }));
    fireEvent.click(screen.getByRole("button", { name: "pick-network" }));
    expect(share.replaceShare).toHaveBeenCalledWith({
      citycode: "33063",
      networkCode: "033001214",
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "nouvelle saisie" },
    });
    expect(share.replaceShare).toHaveBeenCalledWith({
      citycode: null,
      networkCode: null,
    });
  });

  it("moves the highlight up from a middle option", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          suggestions: [suggestion, { ...suggestion, id: "id-2" }],
        }),
      ),
    );

    render(<AddressSearch />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "12 rue Sainte-Catherine" } });
    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(2);
    });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getAllByRole("option")[0]?.getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("clears the field with the custom control", async () => {
    render(<AddressSearch />);
    const input = screen.getByRole("combobox");
    expect(screen.queryByRole("button", { name: "Effacer la saisie" })).toBeNull();
    fireEvent.change(input, { target: { value: "mar" } });
    fireEvent.click(screen.getByRole("button", { name: "Effacer la saisie" }));
    expect((input as HTMLInputElement).value).toBe("");
    expect(screen.queryByRole("button", { name: "Effacer la saisie" })).toBeNull();
  });
});
