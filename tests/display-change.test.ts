import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

import { getDisplayCapabilities, onDisplayChange } from "~/hdr-canvas/hdr-check";

interface MockMQL {
  matches: boolean;
  media: string;
  listeners: Array<() => void>;
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  fire: () => void;
}

function createMQL(matches: boolean, media: string): MockMQL {
  const mql = {
    matches,
    media,
    listeners: [] as Array<() => void>,
    addEventListener(_type: string, listener: () => void): void {
      mql.listeners.push(listener);
    },
    removeEventListener(_type: string, listener: () => void): void {
      mql.listeners = mql.listeners.filter((l) => l !== listener);
    },
    fire(): void {
      for (const listener of [...mql.listeners]) {
        listener();
      }
    }
  };
  return mql;
}

function stubMatchMedia(mqls: Record<string, MockMQL>): void {
  vi.stubGlobal("window", {
    matchMedia: (query: string) => mqls[query] ?? createMQL(false, query)
  });
}

function stubSDRMqls(): Record<string, MockMQL> {
  return {
    "(dynamic-range: high)": createMQL(false, "(dynamic-range: high)"),
    "(color-gamut: p3)": createMQL(false, "(color-gamut: p3)"),
    "(color-gamut: rec2020)": createMQL(false, "(color-gamut: rec2020)")
  };
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("getDisplayCapabilities", () => {
  test("SDR snapshot is all false", () => {
    stubMatchMedia(stubSDRMqls());
    expect(getDisplayCapabilities()).toEqual({
      hdr: false,
      wcg: false,
      dynamicRangeHigh: false,
      colorGamutP3: false,
      colorGamutRec2020: false,
      bitDepthHDR: false
    });
  });

  test("HDR with WCG snapshot", () => {
    const mqls = stubSDRMqls();
    mqls["(dynamic-range: high)"].matches = true;
    mqls["(color-gamut: p3)"].matches = true;
    stubMatchMedia(mqls);
    const caps = getDisplayCapabilities();
    expect(caps.hdr).toBe(true);
    expect(caps.wcg).toBe(true);
    expect(caps.dynamicRangeHigh).toBe(true);
    expect(caps.colorGamutP3).toBe(true);
    expect(caps.colorGamutRec2020).toBe(false);
  });
});

describe("onDisplayChange (issue #107)", () => {
  test("fires with new capabilities when a query flips", () => {
    const mqls = stubSDRMqls();
    stubMatchMedia(mqls);
    const callback = vi.fn();
    const unsubscribe = onDisplayChange(callback);

    // Simulate the window moving to an HDR screen.
    mqls["(dynamic-range: high)"].matches = true;
    mqls["(color-gamut: p3)"].matches = true;
    mqls["(dynamic-range: high)"].fire();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toMatchObject({ hdr: true, wcg: true, dynamicRangeHigh: true });
    unsubscribe();
  });

  test("does not fire when a change event reports no effective change", () => {
    const mqls = stubSDRMqls();
    stubMatchMedia(mqls);
    const callback = vi.fn();
    const unsubscribe = onDisplayChange(callback);

    mqls["(color-gamut: p3)"].fire();

    expect(callback).not.toHaveBeenCalled();
    unsubscribe();
  });

  test("unsubscribe removes listeners", () => {
    const mqls = stubSDRMqls();
    stubMatchMedia(mqls);
    const callback = vi.fn();
    const unsubscribe = onDisplayChange(callback);
    unsubscribe();

    mqls["(dynamic-range: high)"].matches = true;
    mqls["(color-gamut: p3)"].matches = true;
    for (const mql of Object.values(mqls)) {
      mql.fire();
    }

    expect(callback).not.toHaveBeenCalled();
    for (const mql of Object.values(mqls)) {
      expect(mql.listeners).toHaveLength(0);
    }
  });

  test("supports legacy addListener/removeListener", () => {
    const legacyListeners: Array<() => void> = [];
    const legacyMql = {
      matches: false,
      media: "(dynamic-range: high)",
      addListener: (listener: () => void): void => {
        legacyListeners.push(listener);
      },
      removeListener: (listener: () => void): void => {
        const index = legacyListeners.indexOf(listener);
        if (index >= 0) {
          legacyListeners.splice(index, 1);
        }
      }
    };
    vi.stubGlobal("window", {
      matchMedia: (query: string) => (query === "(dynamic-range: high)" ? legacyMql : { matches: false })
    });
    const callback = vi.fn();
    const unsubscribe = onDisplayChange(callback, { pollIntervalMs: 0 });
    expect(legacyListeners).toHaveLength(1);

    // Flip the query result, then fire the legacy listener.
    (legacyMql as { matches: boolean }).matches = true;
    vi.stubGlobal("window", {
      matchMedia: (query: string) => (query === "(dynamic-range: high)" ? legacyMql : createMQL(false, query))
    });
    for (const listener of [...legacyListeners]) {
      listener();
    }

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toMatchObject({ dynamicRangeHigh: true });
    unsubscribe();
    expect(legacyListeners).toHaveLength(0);
  });

  test("falls back to polling when no change events are available", () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    const callback = vi.fn();
    const unsubscribe = onDisplayChange(callback);

    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.advanceTimersByTime(2000);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toMatchObject({ dynamicRangeHigh: true });
    unsubscribe();
  });

  test("pollIntervalMs: 0 disables polling fallback", () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    const callback = vi.fn();
    const unsubscribe = onDisplayChange(callback, { pollIntervalMs: 0 });

    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.advanceTimersByTime(10000);

    expect(callback).not.toHaveBeenCalled();
    unsubscribe();
  });

  test("returns a noop unsubscribe without a window", () => {
    vi.stubGlobal("window", undefined);
    const callback = vi.fn();
    let unsubscribe: () => void = () => undefined;
    expect(() => {
      unsubscribe = onDisplayChange(callback);
    }).not.toThrow();
    expect(() => unsubscribe()).not.toThrow();
    expect(callback).not.toHaveBeenCalled();
  });
});
