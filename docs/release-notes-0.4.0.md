# `hdr-canvas` 0.4.0

# Introduction

This release brings back a lightweight way to scale colors into the HDR range and finishes the `Uint16` cleanup: `Uint16Array` was the pre-137 Chromium experimental HDR path, it is intentionally not part of the WHATWG spec (`Uint8ClampedArray | Float16Array` only) nor the TypeScript DOM lib, so only `Float16` lands.

# Key Changes & New Features

- New `Float16Image` HDR gain scaling (replaces the removed `colorjs.io` based conversion with a dependency-free linear boost)
  - `applyGain(gain)` (in place) and `scaled(gain)` (on a copy), with uniform `number` or per-channel `[r, g, b]` gain. Alpha is preserved by default.
  - Values `>1` push into the HDR headroom and only become visible on a canvas with `toneMapping: { mode: "extended" }` (see `getHdrOptions()`), otherwise they clip to SDR white.
  - The demo image slider (`tests/site/assets/ts/image-slider.ts`) now uses `scaled()` instead of its hand-rolled `pixelCallback` (slider `50` is gain `1`, `100` is gain `2`).
  - New `Float16ImageGain` test suite.
- Breaking type cleanup
  - Removed `Uint16Array` from the exported `HDRImageDataArray` and `HDRImageData` types.
  - Deprecated `HDRImage.SDR_MULTIPLIER` (kept for compat, use `applyGain()` / `scaled()` instead) and corrected the `HDRImagePixelCallback` docs (`0-65535` ints to float `0-1` SDR / `>1` HDR headroom).
- Docs: README notes the package scope (`@projektemacher/hdr-canvas` on npm, `@cmahnke/hdr-canvas` on GitHub Packages).
- Experimental WASM acceleration for gain (AssemblyScript kernel, inlined as base64, disabled by default behind `setWasmEnabled(true)` with transparent JS fallback)
  - Measured on Node 24 over 12 M values: JS ~12 ms vs WASM ~51 ms (~3 ms copies) — engines with native `Float16Array` use hardware F16C conversion that the scalar kernel can't beat, so the flag stays off for now and exists as tested infrastructure (parity within 1 ulp) for future compute-heavy kernels.
- Citation metadata maintenance (`url`, `dateReleased`) and dependency updates (including `assemblyscript` as a devDependency).
