import { describe, expect, test } from "vitest";

import { Float16Image } from "~/hdr-canvas/Float16Image";

function makeImage(): Float16Image {
  const img = new Float16Image(2, 1);
  // SDR range 0-1: pixel0 red-ish, pixel1 mid grey
  img.data.set([0.5, 0.25, 0.125, 1.0, 1.0, 1.0, 1.0, 1.0]);
  return img;
}

describe("Float16Image HDR gain scaling", () => {
  test("applyGain with uniform gain pushes into HDR headroom (>1)", () => {
    const img = makeImage();
    img.applyGain(2);
    expect(img.data[0]).toBeCloseTo(1.0, 3);
    expect(img.data[1]).toBeCloseTo(0.5, 3);
    expect(img.data[4]).toBeCloseTo(2.0, 3);
    // alpha untouched by default
    expect(img.data[3]).toBeCloseTo(1.0, 3);
    expect(img.data[7]).toBeCloseTo(1.0, 3);
  });

  test("applyGain with per-channel gain", () => {
    const img = makeImage();
    img.applyGain([2, 1, 0.5]);
    expect(img.data[0]).toBeCloseTo(1.0, 3);
    expect(img.data[1]).toBeCloseTo(0.25, 3);
    expect(img.data[2]).toBeCloseTo(0.0625, 3);
  });

  test("scaled() does not mutate the original", () => {
    const img = makeImage();
    const out = img.scaled(2);
    expect(out).not.toBe(img);
    expect(out.data[0]).toBeCloseTo(1.0, 3);
    expect(img.data[0]).toBeCloseTo(0.5, 3);
  });

  test("gain 1 is identity (slider default 50/50)", () => {
    const img = makeImage();
    const out = img.scaled([50 / 50, 50 / 50, 50 / 50]);
    expect(Array.from(out.data)).toEqual(Array.from(img.data));
  });
});
