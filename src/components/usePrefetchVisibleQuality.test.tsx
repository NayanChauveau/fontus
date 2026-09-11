/** @vitest-environment happy-dom */

import { act, cleanup, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/presentation/query/queryKeys";
import { createTestQueryClient, renderWithQuery } from "@/test/renderWithQuery";
import { usePrefetchVisibleQuality } from "./usePrefetchVisibleQuality";

const render = renderWithQuery;

function Probe({ networkCode }: { networkCode: string }) {
  const ref = usePrefetchVisibleQuality(networkCode);
  return (
    <button ref={ref} type="button">
      {networkCode}
    </button>
  );
}

type ObserverInstance = {
  callback: IntersectionObserverCallback;
  observe: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

function mockIntersectionObserver() {
  const instances: ObserverInstance[] = [];
  class FakeIntersectionObserver {
    callback: IntersectionObserverCallback;
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
      instances.push(this);
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  return {
    instances,
    trigger(index: number, isIntersecting: boolean) {
      const instance = instances[index];
      if (!instance) {
        throw new Error("missing observer");
      }
      instance.callback(
        [
          {
            isIntersecting,
            target: document.createElement("button"),
          } as unknown as IntersectionObserverEntry,
        ],
        instance as unknown as IntersectionObserver,
      );
    },
  };
}

describe("usePrefetchVisibleQuality", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("prefetches quality once a clickable network enters the viewport", async () => {
    const observer = mockIntersectionObserver();
    const fetchMock = vi.fn(async () =>
      Response.json({
        networkCode: "033001214",
        windowFrom: "2025-09-02",
        source: "cache",
        latestSample: null,
        latestMeasurements: [],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = createTestQueryClient();

    render(<Probe networkCode="033001214" />, client);
    await waitFor(() => {
      expect(screen.getByText("033001214")).toBeTruthy();
    });
    expect(observer.instances).toHaveLength(1);
    expect(fetchMock).not.toHaveBeenCalled();

    act(() => {
      observer.trigger(0, false);
    });
    expect(fetchMock).not.toHaveBeenCalled();

    act(() => {
      observer.trigger(0, true);
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/udi/033001214/quality",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
    expect(observer.instances[0]?.disconnect).toHaveBeenCalled();
    expect(client.getQueryData(queryKeys.quality("033001214"))).toMatchObject({
      networkCode: "033001214",
    });

    act(() => {
      observer.trigger(0, true);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the in-flight prefetch so opening the network does not start a second load", async () => {
    const observer = mockIntersectionObserver();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetchMock = vi.fn(async () => {
      await gate;
      return Response.json({
        networkCode: "033001214",
        windowFrom: "2025-09-02",
        source: "cache",
        latestSample: null,
        latestMeasurements: [],
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = createTestQueryClient();

    render(<Probe networkCode="033001214" />, client);
    act(() => {
      observer.trigger(0, true);
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const { useNetworkQuality } = await import("./useNetworkQuality");
    function Consumer() {
      const { status } = useNetworkQuality("033001214");
      return <p>{status}</p>;
    }
    render(<Consumer />, client);
    expect(screen.getByText("loading")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    release();
    await waitFor(() => {
      expect(screen.getByText("ready")).toBeTruthy();
    });
  });

  it("starts another network fetch without waiting for an in-flight prefetch", async () => {
    const observer = mockIntersectionObserver();
    let releaseFirst: () => void = () => {};
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const fetchMock = vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("033001214")) {
        await firstGate;
        return Response.json({
          networkCode: "033001214",
          windowFrom: "2025-09-02",
          source: "cache",
          latestSample: null,
          latestMeasurements: [],
        });
      }
      return Response.json({
        networkCode: "013000577",
        windowFrom: "2025-09-02",
        source: "cache",
        latestSample: null,
        latestMeasurements: [],
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = createTestQueryClient();

    render(<Probe networkCode="033001214" />, client);
    act(() => {
      observer.trigger(0, true);
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/udi/033001214/quality",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    const { useNetworkQuality } = await import("./useNetworkQuality");
    function Consumer() {
      const { status } = useNetworkQuality("013000577");
      return <p>{status}</p>;
    }
    render(<Consumer />, client);
    await waitFor(() => {
      expect(screen.getByText("ready")).toBeTruthy();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/udi/013000577/quality",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    releaseFirst();
  });

  it("ignores a prefetch failure", async () => {
    const observer = mockIntersectionObserver();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );

    render(<Probe networkCode="033001214" />);
    act(() => {
      observer.trigger(0, true);
    });
    await waitFor(() => {
      expect(observer.instances[0]?.disconnect).toHaveBeenCalled();
    });
  });

  it("does nothing when IntersectionObserver is unavailable", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<Probe networkCode="033001214" />);
    await waitFor(() => {
      expect(screen.getByText("033001214")).toBeTruthy();
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not observe an empty network code", async () => {
    const observer = mockIntersectionObserver();
    render(<Probe networkCode="" />);
    await waitFor(() => {
      expect(screen.getByRole("button")).toBeTruthy();
    });
    expect(observer.instances).toHaveLength(0);
  });
});
