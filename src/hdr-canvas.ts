import { Uint16Image } from "./Uint16Image";

import type { HDRHTMLCanvasElement } from "./types/HDRCanvas.d.ts";

const hdr_options = { colorSpace: Uint16Image.DEFAULT_COLORSPACE, pixelFormat: "float16" };

export function initHDRCanvas(canvas: HDRHTMLCanvasElement): RenderingContext | null {
  canvas.configureHighDynamicRange({ mode: "extended" });
  const ctx = canvas.getContext("2d", hdr_options);
  return ctx;
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export function defaultGetContextHDR() {
  (HTMLCanvasElement.prototype as HDRHTMLCanvasElement)._getContext = HTMLCanvasElement.prototype.getContext;
  (HTMLCanvasElement.prototype as any).getContext = function (type: string, options: object) {
    if (options !== undefined) {
      options = Object.assign({}, options, hdr_options);
    } else {
      options = hdr_options;
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
