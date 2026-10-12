import { getHdrOptions, getWcgOptions } from "./hdr-canvas";

// See https://developer.mozilla.org/en-US/docs/Web/CSS/@media/video-dynamic-range

/**
 * Safely evaluates a CSS media query, returning `false` if `matchMedia` isn't available.
 *
 * @param {string} query - The media query to evaluate.
 * @returns {boolean} `true` if the query matches.
 */
function matchMediaQuery(query: string): boolean {
  try {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/** Check if HDR video is supported using a CSS Media Query.
 * @returns {boolean}
 */
export function checkHDRVideo(): boolean {
  try {
    const dynamicRangeVideoFirefoxMQ: boolean =
      typeof navigator !== "undefined" &&
      navigator.userAgent.toLowerCase().includes("firefox") &&
      matchMediaQuery("(video-dynamic-range: high)");
    // For Safari
    const dynamicRangeHighMQ: boolean = matchMediaQuery("(dynamic-range: high) and (color-gamut: p3)");
    if (dynamicRangeVideoFirefoxMQ || dynamicRangeHighMQ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Check if HDR content (like images) are supported using two CSS Media Queries:
 * One for HDR content itself and another one for the rec2020 colorspace.
 * Note that HDR usually includes WCG, use {@link checkWCG} and {@link checkDynamicRangeHigh}
 * to detect both capabilities separately (see https://github.com/cmahnke/hdr-canvas/issues/23).
 * This function is kept as composite check for backwards compatibility.
 * @returns {boolean}
 */
export function checkHDR(): boolean {
  try {
    if (checkDynamicRangeHigh() && checkWCG()) {
      return true;
    }
    return false;
  } catch (e) {
    console.error("Exception during check for HDR", e);
    return false;
  }
}

/** Check if a high dynamic range is supported using the `(dynamic-range: high)` CSS Media Query.
 * This says nothing about the supported color gamut, combine it with {@link checkWCG}
 * (or use {@link checkHDR} for both) to distinguish HDR-only from HDR with wide color gamut.
 * See https://developer.mozilla.org/en-US/docs/Web/CSS/@media/dynamic-range
 * @returns {boolean}
 */
export function checkDynamicRangeHigh(): boolean {
  return matchMediaQuery("(dynamic-range: high)");
}

/** Check if the Display P3 color gamut is supported using the `(color-gamut: p3)` CSS Media Query.
 * See https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut
 * @returns {boolean}
 */
export function checkColorGamutP3(): boolean {
  return matchMediaQuery("(color-gamut: p3)");
}

/** Check if the Rec.2020 color gamut is supported using the `(color-gamut: rec2020)` CSS Media Query.
 * Note that almost no consumer display covers Rec.2020, so `false` is the normal answer
 * even on good HDR monitors.
 * See https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut
 * @returns {boolean}
 */
export function checkColorGamutRec2020(): boolean {
  return matchMediaQuery("(color-gamut: rec2020)");
}

/** Check if Wide Color Gamut (WCG) content is supported using the `(color-gamut: p3)`
 * and `(color-gamut: rec2020)` CSS Media Queries.
 * This detects WCG independently of HDR: Safari and Firefox on macOS support WCG
 * (`display-p3`) canvases without supporting HDR, see https://github.com/cmahnke/hdr-canvas/issues/23.
 * @returns {boolean}
 */
export function checkWCG(): boolean {
  try {
    if (checkColorGamutP3() || checkColorGamutRec2020()) {
      return true;
    }
    return false;
  } catch (e) {
    console.error("Exception during check for WCG", e);
    return false;
  }
}

/** Check if Wide Color Gamut (WCG) content is supported in a {HTMLCanvasElement}
 * by trying to get a `display-p3` enabled {CanvasRenderingContext2D}.
 * Unlike {@link checkHDRCanvas} this doesn't require `Float16Array` / HDR support,
 * so it also returns `true` on WCG-only browsers like Safari or Firefox on macOS.
 * @returns {boolean}
 */
export function checkWCGCanvas(): boolean {
  if (!checkWCG()) {
    return false;
  }
  try {
    if (typeof document === "undefined") {
      return false;
    }
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    if (!canvas.getContext) {
      return false;
    }

    const options = getWcgOptions();
    const ctx: CanvasRenderingContext2D | null = <CanvasRenderingContext2D>canvas.getContext("2d", options);
    if (ctx === null) {
      return false;
    }
    return true;
  } catch (e) {
    console.error("Bad canvas ColorSpace test for WCG", e);
    return false;
  }
}

/** Check if HDR content is supported in a {HTMLCanvasElement} by tying to get a HDR enabled {CanvasRenderingContext2D}
 * Note that this requires both HDR (dynamic range) and WCG support plus `Float16Array`,
 * use {@link checkWCGCanvas} to detect WCG-only canvas support (e.g. Safari / Firefox on macOS).
 * @returns {boolean}
 */
export function checkHDRCanvas(): boolean {
  if (!checkHDR() || !checkFloat16Array()) {
    return false;
  }
  try {
    if (typeof document === "undefined") {
      return false;
    }
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    if (!canvas.getContext) {
      return false;
    }

    const options = getHdrOptions();
    const ctx: CanvasRenderingContext2D | null = <CanvasRenderingContext2D>canvas.getContext("2d", options);
    if (ctx === null) {
      return false;
    }
    return true;
  } catch (e) {
    console.error(
      "Bad canvas ColorSpace test - make sure that the Chromium browser flag 'enable-experimental-web-platform-features' has been enabled",
      e
    );

    return false;
  }
}

/** Check if Float16Array is supported, to be used in {ImageData}
 * @returns {boolean}
 */
export function checkFloat16Array(): boolean {
  try {
    new ImageData(new Float16Array(4) as any, 1, 1, { pixelFormat: "rgba-float16" } as any);
  } catch (e) {
    console.error("Browser doesn't support Float16Array", e);
    return false;
  }
  return true;
}

/** Check if the supported bit depth is larger then 8
 * Note that this is only a heuristic: browsers commonly report a `colorDepth` of 24
 * even on HDR displays, and WCG-only screens (`display-p3`, still 8 bit per channel)
 * are not distinguished from SDR. On multi-screen setups (see
 * https://github.com/cmahnke/hdr-canvas/issues/107) re-call this - and the other
 * checks - when the screen changes, e.g. via {@link onDisplayChange}, because
 * one-shot results go stale once the window moves to another display.
 * @returns {boolean}
 */
export function checkHDRBitDepth(): boolean {
  try {
    if (typeof screen === "undefined" || typeof screen.colorDepth !== "number") {
      return false;
    }
    const bitsPerChannel: number = screen.colorDepth / 3;
    const hdrSupported: boolean = bitsPerChannel > 8;
    return hdrSupported;
  } catch {
    return false;
  }
}

/** Snapshot of the display capabilities probed by the `check*` functions. */
export interface DisplayCapabilities {
  /** Result of {@link checkHDR} (dynamic range and color gamut). */
  hdr: boolean;
  /** Result of {@link checkWCG} (wide color gamut). */
  wcg: boolean;
  /** Result of {@link checkDynamicRangeHigh}. */
  dynamicRangeHigh: boolean;
  /** Result of {@link checkColorGamutP3}. */
  colorGamutP3: boolean;
  /** Result of {@link checkColorGamutRec2020}. */
  colorGamutRec2020: boolean;
  /** Result of {@link checkHDRBitDepth} (heuristic, see its caveats). */
  bitDepthHDR: boolean;
}

/** Returns the current display capabilities as a single snapshot. */
export function getDisplayCapabilities(): DisplayCapabilities {
  return {
    hdr: checkHDR(),
    wcg: checkWCG(),
    dynamicRangeHigh: checkDynamicRangeHigh(),
    colorGamutP3: checkColorGamutP3(),
    colorGamutRec2020: checkColorGamutRec2020(),
    bitDepthHDR: checkHDRBitDepth()
  };
}

/** Callback invoked with the new display capabilities when they change. */
export type DisplayChangeCallback = (capabilities: DisplayCapabilities) => void;

/** Options for {@link onDisplayChange}. */
export interface DisplayChangeOptions {
  /** Also re-probe on this interval (covers `screen.colorDepth`, which has no change event,
   * and browsers that don't fire media query `change` events when a window moves screens).
   * Defaults to 2000 ms when no `change` listener could be attached, otherwise disabled.
   * Pass `0` to explicitly disable polling. See https://github.com/cmahnke/hdr-canvas/issues/107.
   */
  pollIntervalMs?: number;
}

/** Media queries re-evaluated by {@link onDisplayChange}. */
const DISPLAY_CHANGE_QUERIES = ["(dynamic-range: high)", "(color-gamut: p3)", "(color-gamut: rec2020)"];

/** Default polling fallback when no media query `change` listener can be attached. */
const DISPLAY_CHANGE_POLL_FALLBACK_MS = 2000;

interface LegacyMediaQueryList {
  addListener?: (listener: () => void) => void;
  removeListener?: (listener: () => void) => void;
}

function capabilitiesEqual(a: DisplayCapabilities, b: DisplayCapabilities): boolean {
  return (
    a.hdr === b.hdr &&
    a.wcg === b.wcg &&
    a.dynamicRangeHigh === b.dynamicRangeHigh &&
    a.colorGamutP3 === b.colorGamutP3 &&
    a.colorGamutRec2020 === b.colorGamutRec2020 &&
    a.bitDepthHDR === b.bitDepthHDR
  );
}

/** Subscribe to display capability changes (e.g. the window moves between an HDR
 * and an SDR / external screen), see https://github.com/cmahnke/hdr-canvas/issues/107.
 * Uses media query `change` events where available, with optional polling fallback
 * (automatic when no `change` listener can be attached).
 *
 * @param {DisplayChangeCallback} callback - Invoked with the new capabilities on change.
 * @param {DisplayChangeOptions} [options] - Polling configuration.
 * @returns {() => void} Unsubscribe function that removes all listeners and timers.
 */
export function onDisplayChange(callback: DisplayChangeCallback, options?: DisplayChangeOptions): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  let last: DisplayCapabilities = getDisplayCapabilities();
  const pollIntervalMs: number | undefined = options?.pollIntervalMs;
  const notifyIfChanged = (): void => {
    const current: DisplayCapabilities = getDisplayCapabilities();
    if (!capabilitiesEqual(last, current)) {
      last = current;
      callback(current);
    }
  };
  const cleanups: Array<() => void> = [];
  for (const query of DISPLAY_CHANGE_QUERIES) {
    let mql: MediaQueryList | undefined;
    try {
      mql = window.matchMedia(query);
    } catch {
      continue;
    }
    if (mql === undefined || mql === null) {
      continue;
    }
    const handler = (): void => {
      notifyIfChanged();
    };
    try {
      if (typeof mql.addEventListener === "function") {
        mql.addEventListener("change", handler);
        cleanups.push(() => mql?.removeEventListener("change", handler));
      } else {
        const legacy = mql as unknown as MediaQueryList & LegacyMediaQueryList;
        if (typeof legacy.addListener === "function") {
          legacy.addListener(handler);
          cleanups.push(() => legacy.removeListener?.(handler));
        }
      }
    } catch {
      // Ignore single-query failures, remaining queries still notify.
    }
  }
  let timer: ReturnType<typeof setInterval> | undefined;
  const pollingMs: number | undefined =
    pollIntervalMs === undefined ? (cleanups.length === 0 ? DISPLAY_CHANGE_POLL_FALLBACK_MS : undefined) : pollIntervalMs;
  if (pollingMs !== undefined && pollingMs > 0 && typeof setInterval === "function") {
    timer = setInterval(notifyIfChanged, pollingMs);
  }
  let unsubscribed = false;
  return () => {
    if (unsubscribed) {
      return;
    }
    unsubscribed = true;
    for (const cleanup of cleanups) {
      try {
        cleanup();
      } catch {
        // Ignore cleanup errors.
      }
    }
    if (timer !== undefined) {
      clearInterval(timer);
    }
  };
}
