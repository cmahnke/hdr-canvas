import { Uint16Image } from "./Uint16Image";

import type { HDRHTMLCanvasElement, CanvasRenderingContext2DHDRSettings } from "./types/HDRCanvas.d.ts";

/**
 * Gets a `CanvasRenderingContext2DSettings` object configured for HDR.
 * This function detects the browser version to determine the appropriate `colorType` for HDR support.
 *
 * @returns {CanvasRenderingContext2DHDRSettings} An options object for creating an HDR canvas context.
 */
export function getHdrOptions(): CanvasRenderingContext2DHDRSettings {
  const hdrOptions: CanvasRenderingContext2DHDRSettings = { colorSpace: Uint16Image.DEFAULT_COLORSPACE };
  const majorVersionStr = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
  if (majorVersionStr == null) {
    console.warn(`Unsupported / untested browser (${navigator.userAgent}) detected - using more modern defaults`);
    hdrOptions["colorType"] = "float16";
  } else if (majorVersionStr.length >= 3) {
    const majorVersion = Number(majorVersionStr[2]);
    if (majorVersion < 134) {
      console.warn("Older Chrome / chromium based browser detected, using older `pixelFormat`");
    } else {
      hdrOptions["colorType"] = "float16";
    }
  }

  return hdrOptions;
}

/**
 * Initializes a given `HTMLCanvasElement` for HDR and returns its 2D rendering context.
 * It first configures the canvas for high dynamic range and then gets the 2D context with HDR options.
 *
 * @param {HDRHTMLCanvasElement} canvas - The canvas element to initialize.
 * @returns {RenderingContext | null} The 2D rendering context, or `null` if the context cannot be created.
 */
export function initHDRCanvas(canvas: HDRHTMLCanvasElement): RenderingContext | null {
  canvas.configureHighDynamicRange({ mode: "extended" });
  const ctx = canvas.getContext("2d", getHdrOptions());
  return ctx;
}

/**
 * Patches the `getContext` method of `HTMLCanvasElement` to default to HDR settings.
 * This allows all subsequent calls to `getContext('2d')` to be HDR-enabled without
 * explicitly passing the HDR options.
 *
 * @remarks
 * This function modifies the global `HTMLCanvasElement.prototype` and should be used with caution.
 */
/* eslint-disable  @typescript-eslint/no-explicit-any */
export function defaultGetContextHDR() {
  (HTMLCanvasElement.prototype as HDRHTMLCanvasElement)._getContext = HTMLCanvasElement.prototype.getContext;
  (HTMLCanvasElement.prototype as any).getContext = function (type: string, options: object) {
    if (options !== undefined) {
      options = Object.assign({}, options, getHdrOptions());
    } else {
      options = getHdrOptions();
    }
    return (this as HDRHTMLCanvasElement)._getContext(type, options);
  };
}

/**
 * Resets the `getContext` method of `HTMLCanvasElement` to its original behavior.
 * This reverses the changes made by `defaultGetContextHDR`.
 *
 * @remarks
 * This function only works if `defaultGetContextHDR` has been previously called.
 */
/* eslint-disable  @typescript-eslint/no-explicit-any */
export function resetGetContext() {
  if (typeof (HTMLCanvasElement.prototype as HDRHTMLCanvasElement)._getContext === "function") {
    HTMLCanvasElement.prototype.getContext = (HTMLCanvasElement.prototype as any)._getContext;
  }
}
