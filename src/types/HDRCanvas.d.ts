// See https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts
/// <reference lib="dom" />

type HDRHTMLCanvasOptionsType = "mode";
type HDRHTMLCanvasOptions = { [key in HDRHTMLCanvasOptionsType]?: string };

// `Uint16Array` was the pre-137 Chromium experimental HDR path and is intentionally
// not part of the WHATWG spec (`Uint8ClampedArray | Float16Array` only) nor the TS DOM lib.
// Do not re-add it.
type HDRImageDataArray = ImageDataArray | Float16Array;

interface HDRHTMLCanvasElement extends HTMLCanvasElement {
  configureHighDynamicRange(options: HDRHTMLCanvasOptions): void;
  _getContext(contextId: string, options?: object): RenderingContext | null;
}

interface HDRImageData {
  readonly colorSpace: PredefinedColorSpace;
  readonly data: HDRImageDataArray;
  readonly height: number;
  readonly width: number;
}

// See https://github.com/w3c/ColorWeb-CG/blob/main/hdr_html_canvas_element.md
// "rec2100-display-linear" is left out because of mapping issues
type HDRPredefinedColorSpace = "display-p3" | "srgb" | "rec2100-hlg" | "rec2100-pq";
type HDRCanvasToneMapping = { mode: HDRCanvasToneMappingMode };
type HDRCanvasToneMappingMode = "standard" | "extended";

//enum HDRPredefinedColorSpace {"display-p3", "srgb", "rec2100-hlg", "rec2100-pq", "rec2100-display-linear"};

/**
 * A callback function that receives the red, green, blue, and alpha values of a pixel
 * and returns a new `Float16Array` with the modified values.
 *
 * @callback HDRImagePixelCallback
 * @param {number} red - The red channel value (float, `0-1` SDR, `>1` HDR headroom).
 * @param {number} green - The green channel value (float, `0-1` SDR, `>1` HDR headroom).
 * @param {number} blue - The blue channel value (float, `0-1` SDR, `>1` HDR headroom).
 * @param {number} alpha - The alpha channel value (`0-1`).
 * @returns {ImageDataArray} A new `Float16Array` containing the four channel values.
 */
type HDRImagePixelCallback = (red: number, green: number, blue: number, alpha: number) => HDRImageDataArray;

interface CanvasRenderingContext2DHDR extends CanvasRenderingContext2D {}

interface CanvasRenderingContext2DHDRSettings {
  colorSpace: HDRPredefinedColorSpace;
  pixelFormat?: "uint8" | "float16";
  colorType?: "unorm8" | "float16";
  toneMapping?: HDRCanvasToneMapping;
}

export {
  HDRHTMLCanvasElement,
  HDRPredefinedColorSpace,
  HDRCanvasToneMapping,
  HDRCanvasToneMappingMode,
  HDRImageDataArray,
  HDRImageData,
  HDRImagePixelCallback,
  CanvasRenderingContext2DHDR,
  CanvasRenderingContext2DHDRSettings
};
