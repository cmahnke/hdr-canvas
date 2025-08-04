import { getHdrOptions } from "./hdr-canvas";

// See https://developer.mozilla.org/en-US/docs/Web/CSS/@media/video-dynamic-range

/** Check if HDR video is supported using a CSS Media Query.
 * @returns {boolean}
 */
export function checkHDRVideo(): boolean {
  try {
    const dynamicRangeVideoHighMQ: boolean = window.matchMedia("(video-dynamic-range: high)").matches;
    if (dynamicRangeVideoHighMQ) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/** Check if HDR content (like images) are supported using two CSS Media Queries:
 * One for HDR content itself and another one for the rec2020 colorspace
 * @returns {boolean}
 */
export function checkHDR(): boolean {
  try {
    const bitsPerChannel: number = screen.colorDepth / 3;
    const hdrSupported: boolean = bitsPerChannel > 8;

    //TODO: Test if this works as expected
    const dynamicRangeHighMQ: boolean = window.matchMedia("(dynamic-range: high)").matches;
    const colorGamutMQ: boolean = window.matchMedia("(color-gamut: rec2020)").matches || window.matchMedia("(color-gamut: p3)").matches;
    if (colorGamutMQ && dynamicRangeHighMQ) {
      if (bitsPerChannel !== Math.round(bitsPerChannel)) {
        // iOS bug
        return false;
      } else if (hdrSupported) {
        return true;
      } else {
        return false;
      }
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
  try {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    if (!canvas.getContext) {
      return false;
    }

    const options = getHdrOptions();
    const ctx: CanvasRenderingContext2D | null = <CanvasRenderingContext2D>canvas.getContext("2d", options);
    //canvas.drawingBufferColorSpace = colorSpace;
    //canvas.unpackColorSpace = colorSpace;
    if (ctx === null) {
      return false;
    }
    return true;
  } catch (e) {
    console.error(
      "Bad canvas ColorSpace test - make sure that the Chromium browser flag 'enable-experimental-web-platform-features' has been enabled"
    );

    return false;
  }
}
