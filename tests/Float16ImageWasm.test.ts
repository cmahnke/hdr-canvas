import { afterEach, describe, expect, test, vi } from "vitest";

import { Float16Image } from "~/hdr-canvas/Float16Image";
import { WASM_MIN_VALUES, isWasmEnabled, isWasmReady, setWasmEnabled } from "~/hdr-canvas/wasm";

afterEach(() => {
  setWasmEnabled(false);
});

function makeImage(pixels: number): Float16Image {
  const img = new Float16Image(pixels, 1);
  let seed = 123456789;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < img.data.length; i++) {
    // Uniform in [-3, 3] so the HDR headroom (>1) is covered too.
    img.data[i] = rand() * 6 - 3;
  }
  return img;
}

function jsReference(img: Float16Image, gain: number | [number, number, number], preserveAlpha = true): Float16Array {
  const ref = img.clone();
  ref.applyGain(gain, { preserveAlpha, useWasm: false });
  return ref.data;
}

/** Max ulp distance between two f16 bit patterns, NaN-aware. */
function maxUlpDistance(a: Uint16Array, b: Uint16Array): number {
  let max = 0;
  for (let i = 0; i < a.length; i++) {
    const va = a[i];
    const vb = b[i];
    if (va === vb) {
      continue;
    }
    // Both NaN (exponent all ones, nonzero mantissa) counts as equal.
    if ((va & 0x7c00) === 0x7c00 && (va & 0x03ff) !== 0 && (vb & 0x7c00) === 0x7c00 && (vb & 0x03ff) !== 0) {
      continue;
    }
    max = Math.max(max, Math.abs(va - vb));
  }
  return max;
}

function asU16(data: Float16Array): Uint16Array {
  return new Uint16Array(data.buffer, data.byteOffset, data.length);
}

describe("WASM flag", () => {
  test("disabled by default and never instantiates", () => {
    expect(isWasmEnabled()).toBe(false);
    const img = makeImage(QuarterOfThreshold());
    img.applyGain(2);
    expect(isWasmReady()).toBe(false);
  });

  test("useWasm:false override keeps WASM cold when enabled", () => {
    setWasmEnabled(true);
    const img = makeImage(WASM_MIN_VALUES / 4 + 64);
    img.applyGain(2, { useWasm: false });
    expect(isWasmReady()).toBe(false);
  });

  test("below-threshold arrays stay on the JS path", () => {
    setWasmEnabled(true);
    const img = makeImage(64);
    const ref = jsReference(img, 2);
    img.applyGain(2);
    expect(Array.from(img.data)).toEqual(Array.from(ref));
  });
});

describe("WASM parity with JS", () => {
  test("uniform gain matches within 1 ulp, incl. specials", () => {
    setWasmEnabled(true);
    const img = makeImage(WASM_MIN_VALUES / 4 + 64);
    // Inject specials: zeros, subnormals, inf, NaN, max f16, negatives.
    const specials = [0, -0, 5.96e-8, -5.96e-8, 65504, -65504, Infinity, -Infinity, NaN, 0.5, 2.5];
    for (let i = 0; i < specials.length; i++) {
      img.data[i] = specials[i];
    }
    const ref = jsReference(img, 1.75);
    img.applyGain(1.75);
    expect(isWasmReady()).toBe(true);
    expect(maxUlpDistance(asU16(img.data), asU16(ref))).toBeLessThanOrEqual(1);
  });

  test("per-channel gain matches within 1 ulp and preserves alpha", () => {
    setWasmEnabled(true);
    const img = makeImage(WASM_MIN_VALUES / 4 + 64);
    const before = Array.from(asU16(img.data).filter((_, i) => i % 4 === 3));
    const ref = jsReference(img, [2, 0.5, 1.5]);
    img.applyGain([2, 0.5, 1.5]);
    expect(maxUlpDistance(asU16(img.data), asU16(ref))).toBeLessThanOrEqual(1);
    expect(Array.from(asU16(img.data).filter((_, i) => i % 4 === 3))).toEqual(before);
  });

  test("scaled() matches within 1 ulp without mutating the original", () => {
    setWasmEnabled(true);
    const img = makeImage(WASM_MIN_VALUES / 4 + 64);
    const snapshot = img.data.slice();
    const out = img.scaled(0.25);
    expect(Array.from(img.data)).toEqual(Array.from(snapshot));
    const ref = jsReference(img, 0.25);
    expect(maxUlpDistance(asU16(out.data), asU16(ref))).toBeLessThanOrEqual(1);
  });
});

describe("WASM fallback", () => {
  test("missing WebAssembly falls back to correct JS results", async () => {
    // Fresh module registry: no cached instance may exist for this to be meaningful.
    vi.resetModules();
    const realWasm = globalThis.WebAssembly;
    try {
      Object.defineProperty(globalThis, "WebAssembly", { value: undefined, configurable: true, writable: true });
      const freshWasm = await import("~/hdr-canvas/wasm");
      expect(freshWasm.tryApplyGainWasm(new Float16Array(8), 2, 2, 2, 1)).toBe(false);
      freshWasm.setWasmEnabled(true);
      const { Float16Image: FreshImage } = await import("~/hdr-canvas/Float16Image");
      const img = new FreshImage(WASM_MIN_VALUES / 4 + 64, 1);
      for (let i = 0; i < img.data.length; i++) {
        img.data[i] = (i % 100) / 100;
      }
      const ref = img.clone();
      ref.applyGain(2, { useWasm: false });
      img.applyGain(2);
      expect(Array.from(img.data)).toEqual(Array.from(ref.data));
      expect(freshWasm.isWasmReady()).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "WebAssembly", { value: realWasm, configurable: true, writable: true });
      vi.resetModules();
    }
  });
});

function QuarterOfThreshold(): number {
  return WASM_MIN_VALUES / 16;
}
