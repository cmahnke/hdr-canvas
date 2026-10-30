/**
 * Shared logic for the HDR canvas verification test page
 * (`tests/site/hdr-verify.html`) and its headless unit test (`tests/hdr-readback.test.ts`).
 *
 * Contains only dependency free code so it can also run in a node environment.
 */

/**
 * Description of a rectangular region to measure in the canvas readback.
 * Coordinates are in canvas pixels.
 */
export interface MeasureRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Linear value the patch is expected to render (raw material values) */
  expected?: number;
}

/** Layout constants, shared between the page and the verdict evaluation */
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;

/** Patch bar values (SDR reference white relative, scene linear) */
export const PATCH_VALUES = [1.0, 1.5, 2.5, 4.0, 8.0];

/** Patch geometry in canvas pixels: 5 bars with gaps, centered */
export const PATCH_RECT = {
  offsetY: 15,
  height: 60,
  width: 140,
  gap: 20
};
/** Texture plane area in canvas pixels (below the patches) */
export const TEXTURE_RECT = {
  offsetY: 160,
  height: 270
};

/**
 * Layout of the measurement regions. Patches are laid out in a top row,
 * the texture bars fill the area below. Returns rects in canvas pixels for
 * a canvas of the given size (see `CANVAS_WIDTH` / `CANVAS_HEIGHT`).
 */
export function getMeasureRects(): MeasureRect[] {
  const rects: MeasureRect[] = [];
  const patchCount = PATCH_VALUES.length;
  const patchStride = PATCH_RECT.width + PATCH_RECT.gap;
  const totalWidth = patchCount * PATCH_RECT.width + (patchCount - 1) * PATCH_RECT.gap;
  const offsetX = Math.floor((CANVAS_WIDTH - totalWidth) / 2);
  for (let i = 0; i < patchCount; i++) {
    rects.push({
      id: `patch-${PATCH_VALUES[i]}`,
      x: offsetX + i * patchStride,
      y: PATCH_RECT.offsetY,
      width: PATCH_RECT.width,
      height: PATCH_RECT.height,
      expected: PATCH_VALUES[i]
    });
  }
  // Texture bars: 4 bars over the full width, inset to avoid edges
  const barWidth = CANVAS_WIDTH / 4;
  for (let i = 0; i < 4; i++) {
    rects.push({
      id: `tex-${i}`,
      x: Math.round(i * barWidth + barWidth * 0.25),
      y: TEXTURE_RECT.offsetY,
      width: Math.round(barWidth * 0.5),
      height: TEXTURE_RECT.height
    });
  }
  return rects;
}

/**
 * Decodes a GPU canvas buffer (row aligned to 256 bytes) and measures the
 * maximum RGB value within each measurement rect.
 *
 * @param bytesPerPixel bytes per texel, 8 (rgba16float) or 4 (e.g. bgra8unorm)
 */
export function measureRects(
  buffer: ArrayBuffer,
  width: number,
  height: number,
  rects: MeasureRect[],
  bytesPerPixel = 8
): Record<string, number> {
  const bytesPerRow = Math.ceil((width * bytesPerPixel) / 256) * 256;
  const view = new DataView(buffer);
  const results: Record<string, number> = {};
  for (const rect of rects) {
    let max = 0;
    for (let y = rect.y; y < Math.min(rect.y + rect.height, height); y++) {
      for (let x = rect.x; x < Math.min(rect.x + rect.width, width); x++) {
        const offset = y * bytesPerRow + x * bytesPerPixel;
        for (let c = 0; c < 3; c++) {
          const raw = view.getUint16(offset + c * 2, true);
          // 8 bit formats decode as subnormals in f16 view, scale them to 0-1
          max = Math.max(max, bytesPerPixel === 4 ? decodeHalf(raw) * 128 : decodeHalf(raw));
        }
      }
    }
    results[rect.id] = max;
  }
  return results;
}

/** Decodes IEEE 754 half precision to a double */
export function decodeHalf(bits: number): number {
  const sign = bits & 0x8000 ? -1 : 1;
  let exponent = (bits & 0x7c00) >> 10;
  const rawMantissa = bits & 0x03ff;
  let mantissa = rawMantissa;
  if (exponent === 0x1f) {
    return sign * (mantissa ? Number.NaN : Infinity);
  }
  if (exponent === 0) {
    if (mantissa === 0) return sign * 0;
    // Subnormal: shift until normalized
    exponent = 1 - 15;
    while (!(mantissa & 0x400)) {
      mantissa <<= 1;
      exponent--;
    }
    mantissa &= 0x3ff;
    return sign * (1 + mantissa / 0x400) * Math.pow(2, exponent);
  }
  return sign * (1 + mantissa / 0x400) * Math.pow(2, exponent - 15);
}

/** Shape of the verdict object reported by the test page */
export interface VerifyVerdict {
  done: boolean;
  error?: string;
  /** Whether the canvas context is configured with HDR options */
  hdrCanvas: boolean;
  dynamicRangeHigh: boolean;
  canvasFormat: string | null;
  canvasColorSpace: string | null;
  toneMappingMode: string | null;
  renderer: string;
  /** Measured max RGB per region, see `getMeasureRects` */
  measured: Record<string, number>;
  /** Whether the UltraHDR texture gained values above 1.0 (informational, Chrome may not apply gain maps on texture uploads) */
  textureHDR: boolean;
  pass: boolean;
}

/**
 * Evaluates the measured values. A passing result requires:
 * - raw patches to render at their expected linear value (5% tolerance)
 * - patch values strictly increasing
 * - texture bars strictly increasing (proves the texture rendered; note that
 *   Chrome does not apply UltraHDR gain maps on `copyExternalImageToTexture`
 *   uploads, so the texture usually renders as its tone mapped SDR base)
 * - when `(dynamic-range: high)` matches: the canvas must be configured with
 *   float16, rec2100-hlg and extended tone mapping
 *
 * Whether the texture gained above 1.0 is reported informationally as
 * `textureHDR` and does not affect the pass state.
 */
export function evaluateVerdict(
  measured: Record<string, number>,
  info: {
    hdrCanvas: boolean;
    dynamicRangeHigh: boolean;
    canvasFormat: string | null;
    canvasColorSpace: string | null;
    toneMappingMode: string | null;
  }
): VerifyVerdict {
  const verdict: VerifyVerdict = {
    done: true,
    pass: true,
    hdrCanvas: info.hdrCanvas,
    dynamicRangeHigh: info.dynamicRangeHigh,
    canvasFormat: info.canvasFormat,
    canvasColorSpace: info.canvasColorSpace,
    toneMappingMode: info.toneMappingMode,
    renderer: "",
    measured,
    textureHDR: false
  };
  const reasons: string[] = [];
  const patchRects = getMeasureRects().filter((r) => r.expected !== undefined);
  let previous = -Infinity;
  for (const rect of patchRects) {
    const value = measured[rect.id];
    if (value === undefined) {
      reasons.push(`missing measurement for ${rect.id}`);
      continue;
    }
    if (Math.abs(value - rect.expected!) > rect.expected! * 0.05 + 0.01) {
      reasons.push(`${rect.id}: measured ${value.toFixed(3)} != expected ${rect.expected}`);
    }
    if (value <= previous) {
      reasons.push(`${rect.id}: ${value.toFixed(3)} not above previous ${previous.toFixed(3)}`);
    }
    previous = value;
  }
  const textureValues = getMeasureRects()
    .filter((r) => r.id.startsWith("tex-"))
    .map((r) => measured[r.id] ?? Number.NaN);
  for (let i = 1; i < textureValues.length; i++) {
    if (textureValues[i] <= textureValues[i - 1]) {
      reasons.push(`texture bar ${i}: ${textureValues[i].toFixed(3)} not above ${textureValues[i - 1].toFixed(3)}`);
    }
  }
  verdict.textureHDR = textureValues[textureValues.length - 1] > 1.001;
  if (info.dynamicRangeHigh) {
    const formatOk = info.canvasFormat?.includes("16float") ?? false;
    if (!formatOk) reasons.push(`canvas format ${info.canvasFormat} is not float16`);
    if (info.canvasColorSpace !== "rec2100-hlg") reasons.push(`canvas colorSpace ${info.canvasColorSpace} is not rec2100-hlg`);
    if (info.toneMappingMode !== "extended") reasons.push(`toneMapping mode ${info.toneMappingMode} is not extended`);
  }
  verdict.pass = reasons.length === 0;
  return verdict;
}
