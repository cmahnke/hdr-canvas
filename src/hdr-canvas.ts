import {Uint16Image} from './Uint16Image'

export function initHDRCanvas(canvas : HDRHTMLCanvasElement) : RenderingContext | null {
  canvas.configureHighDynamicRange({mode: 'extended'});
  const ctx = canvas.getContext("2d", {colorSpace: Uint16Image.DEFAULT_COLORSPACE, pixelFormat: 'float16'});
  return ctx;
}
