import { describe, expect, test } from "vitest";

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  PATCH_VALUES,
  decodeHalf,
  evaluateVerdict,
  getMeasureRects,
  measureRects,
  type MeasureRect
} from "./site/assets/ts/hdr-verify-lib";

describe("decodeHalf", () => {
  test("decodes common values exactly", () => {
    expect(decodeHalf(0x0000)).toBe(0);
    expect(decodeHalf(0x8000)).toBe(-0);
    expect(decodeHalf(0x3c00)).toBe(1);
    expect(decodeHalf(0xbc00)).toBe(-1);
    expect(decodeHalf(0x3800)).toBe(0.5);
    expect(decodeHalf(0x47c0)).toBe(7.75);
    expect(decodeHalf(0x7bff)).toBeCloseTo(65504, 5);
    expect(decodeHalf(0x7c00)).toBe(Infinity);
    expect(decodeHalf(0x7e00)).toBeNaN();
  });

  test("matches struct round trip values used by the generator", () => {
    // Half bits of 1.0, 2.0, 4.0, 8.0 (little endian words)
    expect(decodeHalf(0x3c00)).toBe(1);
    expect(decodeHalf(0x4000)).toBe(2);
    expect(decodeHalf(0x4400)).toBe(4);
    expect(decodeHalf(0x4800)).toBe(8);
  });
});

describe("measureRects", () => {
  test("measures the max RGB value within each rect", () => {
    // 4x2 image, bytesPerRow padded to 256
    const width = 4;
    const height = 2;
    const buffer = new ArrayBuffer(256 * 2);
    const view = new DataView(buffer);
    // f16 bits: 1.0 = 0x3c00, 2.0 = 0x4000
    // Left half of row 0: 1.0, right half: 2.0
    for (let x = 0; x < width; x++) {
      const value = x < 2 ? 0x3c00 : 0x4000;
      for (let c = 0; c < 4; c++) {
        view.setUint16(256 * 0 + x * 8 + c * 2, value, true);
      }
    }
    // Row 1 has a higher value (4.0 = 0x4400) only in the first pixel
    for (let c = 0; c < 4; c++) {
      view.setUint16(256 * 1 + 0 * 8 + c * 2, 0x4400, true);
    }
    const rects: MeasureRect[] = [
      { id: "a", x: 0, y: 0, width: 2, height: 1, expected: 1 },
      { id: "b", x: 2, y: 0, width: 2, height: 1, expected: 2 },
      { id: "c", x: 0, y: 0, width: 4, height: 2, expected: 4 }
    ];
    const measured = measureRects(buffer, width, height, rects);
    expect(measured["a"]).toBe(1);
    expect(measured["b"]).toBe(2);
    expect(measured["c"]).toBe(4);
  });

  test("ignores the alpha channel", () => {
    const width = 2;
    const buffer = new ArrayBuffer(256);
    const view = new DataView(buffer);
    // Alpha (channel 3) is a huge value, RGB at x=1 is 2.0
    view.setUint16(0 * 8 + 3 * 2, 0x7c00, true); // inf
    for (let c = 0; c < 3; c++) {
      view.setUint16(1 * 8 + c * 2, 0x4000, true);
    }
    const rect: MeasureRect = { id: "r", x: 0, y: 0, width: 2, height: 1 };
    const measured = measureRects(buffer, width, 1, [rect]);
    expect(measured["r"]).toBe(2);
  });
});

describe("getMeasureRects", () => {
  const rects = getMeasureRects();

  test("contains one rect per patch and four texture rects", () => {
    expect(rects.filter((r) => r.expected !== undefined).map((r) => r.expected)).toEqual(PATCH_VALUES);
    expect(rects.filter((r) => r.id.startsWith("tex-")).length).toBe(4);
  });

  test("all rects are within canvas bounds and unique", () => {
    const ids = new Set(rects.map((r) => r.id));
    expect(ids.size).toBe(rects.length);
    for (const rect of rects) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(CANVAS_WIDTH);
      expect(rect.y + rect.height).toBeLessThanOrEqual(CANVAS_HEIGHT);
    }
  });
});

describe("evaluateVerdict", () => {
  const infoHDR = {
    hdrCanvas: true,
    dynamicRangeHigh: true,
    canvasFormat: "rgba16float",
    canvasColorSpace: "rec2100-hlg",
    toneMappingMode: "extended"
  };
  const infoSDR = {
    hdrCanvas: false,
    dynamicRangeHigh: false,
    canvasFormat: "rgba16float",
    canvasColorSpace: "srgb",
    toneMappingMode: "standard"
  };

  test("passes for a correct HDR measurement", () => {
    const rects = getMeasureRects();
    const measured: Record<string, number> = {};
    for (const rect of rects) {
      if (rect.expected !== undefined) measured[rect.id] = rect.expected;
      else measured[rect.id] = 1 + Number(rect.id.split("-")[1]) * 1.5;
    }
    measured["tex-0"] = 1.0;
    measured["tex-1"] = 1.5;
    measured["tex-2"] = 4.0;
    measured["tex-3"] = 8.0;
    const verdict = evaluateVerdict(measured, infoHDR);
    expect(verdict.pass).toBe(true);
    expect(verdict.done).toBe(true);
  });

  test("fails when the texture is uniform (e.g. not rendered)", () => {
    const rects = getMeasureRects();
    const measured: Record<string, number> = {};
    for (const rect of rects) {
      if (rect.expected !== undefined) measured[rect.id] = rect.expected;
      else measured[rect.id] = 0.5;
    }
    const verdict = evaluateVerdict(measured, infoHDR);
    expect(verdict.pass).toBe(false);
    expect(verdict.measured["tex-0"]).toBe(0.5);
  });

  test("fails when the canvas is not configured for HDR on an HDR display", () => {
    const rects = getMeasureRects();
    const measured: Record<string, number> = {};
    for (const rect of rects) {
      if (rect.expected !== undefined) measured[rect.id] = rect.expected;
      else measured[rect.id] = 1 + Number(rect.id.split("-")[1]) * 1.5;
    }
    measured["tex-0"] = 1.0;
    measured["tex-1"] = 1.5;
    measured["tex-2"] = 4.0;
    measured["tex-3"] = 8.0;
    const verdict = evaluateVerdict(measured, { ...infoHDR, canvasColorSpace: "srgb", toneMappingMode: "standard" });
    expect(verdict.pass).toBe(false);
  });

  test("reports textureHDR informationally", () => {
    const rects = getMeasureRects();
    const build = (texMax: number) => {
      const measured: Record<string, number> = {};
      for (const rect of rects) {
        if (rect.expected !== undefined) measured[rect.id] = rect.expected;
        else measured[rect.id] = texMax - (3 - Number(rect.id.split("-")[1])) * 0.01;
      }
      return evaluateVerdict(measured, infoHDR);
    };
    expect(build(8.0).textureHDR).toBe(true);
    expect(build(0.9).textureHDR).toBe(false);
    // The texture state does not affect the pass result
    expect(build(0.9).pass).toBe(true);
  });

  test("passes on a SDR display with only patch checks", () => {
    const rects = getMeasureRects();
    const measured: Record<string, number> = {};
    for (const rect of rects) {
      if (rect.expected !== undefined) measured[rect.id] = rect.expected;
      else measured[rect.id] = 1 + Number(rect.id.split("-")[1]) * 1.5;
    }
    measured["tex-0"] = 1.0;
    measured["tex-1"] = 1.5;
    measured["tex-2"] = 4.0;
    measured["tex-3"] = 8.0;
    const verdict = evaluateVerdict(measured, infoSDR);
    expect(verdict.pass).toBe(true);
  });

  test("fails when patches do not match their expected value", () => {
    const rects = getMeasureRects();
    const measured: Record<string, number> = {};
    for (const rect of rects) {
      if (rect.expected !== undefined) measured[rect.id] = rect.expected === 4 ? 1 : rect.expected;
      else measured[rect.id] = 4.0;
    }
    const verdict = evaluateVerdict(measured, infoHDR);
    expect(verdict.pass).toBe(false);
  });
});
