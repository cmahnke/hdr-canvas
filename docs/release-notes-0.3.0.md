# `hdr-canvas` 0.3.0

# Introduction

This release moves the package into an org and separates WCG from HDR detection.

The package is now published as `@projektemacher/hdr-canvas` on npm (GitHub Packages publishes it as `@cmahnke/hdr-canvas` via a rewrite in `.github/workflows/npm.yml`):

```
npm i @projektemacher/hdr-canvas
```

Additionally `main` was fixed to `dist/hdr-canvas.js` and the `LICENCE` typo in the `files` list was corrected to `LICENSE`.

# Key Changes & New Features

- Detect WCG and HDR separately ([#23](https://github.com/cmahnke/hdr-canvas/issues/23), [#107](https://github.com/cmahnke/hdr-canvas/issues/107))
  - New checks: `checkWCG`, `checkWCGCanvas`, `checkDynamicRangeHigh`, `checkColorGamutP3` / `checkColorGamutRec2020` and `getWcgOptions()` (`display-p3`, for WCG-only browsers like Safari and Firefox on macOS).
  - New `getDisplayCapabilities()` and `onDisplayChange()` subscription (media query `change` events with polling fallback), so moving a window between screens re-evaluates the display.
  - Checks hardened against missing `window` / `document` / `screen`.
  - Demo site, README docs and import fixture updated, new `hdr-check` and `display-change` test suites added.
- More robust `HDRImage` base class
  - Removed unimplemented `fromImageData` / `fromImageDataArray` stubs.
  - `loadSDRImageData()` checks `response.ok` and catches failures instead of rejecting.
  - `getPixel()` / `setPixel()` throw a `RangeError` outside the image bounds.
  - Fixed `clone()` to actually deep-copy `data`.
- Safari handling extracted into `src/browser.ts` (`isSafari()`), reused in `src/hdr-canvas.ts` and (duplicated, kept in sync) in `three/HDRWebGPUBackend.js`.
- `defaultGetContextHDR()` is now idempotent and only patches `"2d"` contexts, `resetGetContext()` fully restores the original `getContext`.
- New `tests/version-check.ts` global setup enforcing `engines.node` for the test run.
- Dependency updates, including `vitest` 4 to 5.
