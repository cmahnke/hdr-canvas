import { getHdrOptions } from "./hdr-canvas";

// See https://developer.mozilla.org/en-US/docs/Web/CSS/@media/video-dynamic-range

/** Check if HDR video is supported using a CSS Media Query.
 * @returns {boolean}
 */
export function checkHDRVideo(): boolean {
  try {
    const dynamicRangeVideoFirefoxMQ: boolean =
      navigator.userAgent.toLowerCase().includes("firefox") && window.matchMedia("(video-dynamic-range: high)").matches;
    // For Safari
    const dynamicRangeHighMQ: boolean = window.matchMedia("(dynamic-range: high) and (color-gamut: p3)").matches;
    if (dynamicRangeVideoFirefoxMQ || dynamicRangeHighMQ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Check if HDR content (like images) are supported using two CSS Media Queries:
 * One for HDR content itself and another one for the rec2020 colorspace
 * @returns {boolean}
 */
export function checkHDR(): boolean {
  try {
    const dynamicRangeHighMQ: boolean = window.matchMedia("(dynamic-range: high)").matches;
    const colorGamutMQ: boolean = window.matchMedia("(color-gamut: rec2020)").matches || window.matchMedia("(color-gamut: p3)").matches;
    if (colorGamutMQ && dynamicRangeHighMQ) {
      return true;
    }
    return false;
  } catch (e) {
    console.error("Exception during check for HDR", e);
    return false;
  }
}

/** Check if HDR content is supported in a {HTMLCanvasElement} by tying to get a HDR enabled {CanvasRenderingContext2D}
 * @returns {boolean}
 */
export function checkHDRCanvas(): boolean {
  if (!checkHDR() || !checkFloat16Array()) {
    return false;
  }
  try {
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
  return false;
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
 * @returns {boolean}
 */
export function checkHDRBitDepth(): boolean {
  const bitsPerChannel: number = screen.colorDepth / 3;
  const hdrSupported: boolean = bitsPerChannel > 8;
  return hdrSupported;
}
