import { Uint16Image } from "./Uint16Image";

import type { HDRHTMLCanvasElement, HDRPredefinedColorSpace, CanvasRenderingContext2DHDRSettings } from "./types/HDRCanvas.d.ts";


function getHdrOptions(): CanvasRenderingContext2DHDRSettings {
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

export function initHDRCanvas(canvas: HDRHTMLCanvasElement): RenderingContext | null {
  canvas.configureHighDynamicRange({ mode: "extended" });
  const ctx = canvas.getContext("2d", getHdrOptions());
  return ctx;
}

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

/* eslint-disable  @typescript-eslint/no-explicit-any */
export function resetGetContext() {
  if (typeof (HTMLCanvasElement.prototype as HDRHTMLCanvasElement)._getContext === "function") {
    HTMLCanvasElement.prototype.getContext = (HTMLCanvasElement.prototype as any)._getContext;
  }
}
