import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

import {
  checkWCG,
  checkHDR,
  checkDynamicRangeHigh,
  checkColorGamutP3,
  checkColorGamutRec2020,
  checkWCGCanvas,
  checkHDRCanvas
} from "~/hdr-canvas/hdr-check";
import { getWcgOptions } from "~/hdr-canvas/hdr-canvas";

function stubMatchMedia(matchesByQuery: Record<string, boolean>): void {
  vi.stubGlobal("window", {
    matchMedia: (query: string) => ({
      matches: matchesByQuery[query] ?? false,
      media: query
    })
  });
}

function stubCanvasForColorSpaces(supported: string[]): void {
  const createElement = (tag: string) => {
    if (tag !== "canvas") {
      return {};
    }
    return {
      getContext: (_type: string, options?: { colorSpace?: string }) => {
        if (options?.colorSpace !== undefined && supported.includes(options.colorSpace)) {
          return {};
        }
        // Context without explicit options (shouldn't happen in our checks)
        if (options === undefined) {
          return {};
        }
        return null;
      }
    };
  };
  vi.stubGlobal("document", { createElement });
}

function stubImageDataSuccess(): void {
  vi.stubGlobal(
    "ImageData",
    class {
      constructor() {
        // Accept any args, mimic browser success
      }
    }
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WCG vs HDR separation (issue #23)", () => {
  test("SDR: everything false", () => {
    stubMatchMedia({});
    expect(checkColorGamutP3()).toBe(false);
    expect(checkColorGamutRec2020()).toBe(false);
    expect(checkWCG()).toBe(false);
    expect(checkDynamicRangeHigh()).toBe(false);
    expect(checkHDR()).toBe(false);
  });

  test("WCG-only (Safari / Firefox macOS): p3 without dynamic-range", () => {
    stubMatchMedia({
      "(color-gamut: p3)": true,
      "(color-gamut: rec2020)": false,
      "(dynamic-range: high)": false
    });
    expect(checkWCG()).toBe(true);
    expect(checkDynamicRangeHigh()).toBe(false);
    // Composite HDR check requires both, so stays false
    expect(checkHDR()).toBe(false);
  });

  test("HDR-only (brightened without wide gamut): dynamic-range without color-gamut", () => {
    stubMatchMedia({
      "(color-gamut: p3)": false,
      "(color-gamut: rec2020)": false,
      "(dynamic-range: high)": true
    });
    expect(checkWCG()).toBe(false);
    expect(checkDynamicRangeHigh()).toBe(true);
    expect(checkHDR()).toBe(false);
  });

  test("HDR with WCG: both true", () => {
    stubMatchMedia({
      "(color-gamut: p3)": true,
      "(dynamic-range: high)": true
    });
    expect(checkWCG()).toBe(true);
    expect(checkDynamicRangeHigh()).toBe(true);
    expect(checkHDR()).toBe(true);
  });

  test("rec2020 alone counts as WCG", () => {
    stubMatchMedia({
      "(color-gamut: p3)": false,
      "(color-gamut: rec2020)": true,
      "(dynamic-range: high)": false
    });
    expect(checkWCG()).toBe(true);
    expect(checkHDR()).toBe(false);
  });

  test("missing window.matchMedia returns false instead of throwing", () => {
    vi.stubGlobal("window", {});
    expect(checkWCG()).toBe(false);
    expect(checkHDR()).toBe(false);
    expect(checkDynamicRangeHigh()).toBe(false);
  });

  test("getWcgOptions uses display-p3 without HDR requirements", () => {
    const options = getWcgOptions();
    expect(options.colorSpace).toBe("display-p3");
    expect(options.colorType).toBeUndefined();
    expect(options.toneMapping).toBeUndefined();
  });

  test("checkWCGCanvas true on WCG-only with display-p3 canvas", () => {
    stubMatchMedia({ "(color-gamut: p3)": true });
    stubCanvasForColorSpaces(["display-p3"]);
    expect(checkWCGCanvas()).toBe(true);
  });

  test("checkWCGCanvas false on SDR even with capable canvas", () => {
    stubMatchMedia({});
    stubCanvasForColorSpaces(["display-p3"]);
    expect(checkWCGCanvas()).toBe(false);
  });

  test("checkWCGCanvas false when canvas rejects display-p3", () => {
    stubMatchMedia({ "(color-gamut: p3)": true });
    stubCanvasForColorSpaces([]);
    expect(checkWCGCanvas()).toBe(false);
  });

  test("checkHDRCanvas still gates on HDR + Float16Array (WCG-only is not enough)", () => {
    // WCG-only media state, HDR canvas probe would succeed, but checkHDR() is false
    stubMatchMedia({ "(color-gamut: p3)": true, "(dynamic-range: high)": false });
    stubCanvasForColorSpaces(["display-p3", "rec2100-hlg", "rec2100-pq"]);
    stubImageDataSuccess();
    expect(checkHDRCanvas()).toBe(false);
    // WCG canvas is the correct positive signal here
    expect(checkWCGCanvas()).toBe(true);
  });
});
