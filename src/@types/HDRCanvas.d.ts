// See https://github.com/microsoft/TypeScript/blob/main/src/lib/dom.generated.d.ts

type HDRHTMLCanvasOptionsType = "mode";
type HDRHTMLCanvasOptions = { [key in HDRHTMLCanvasOptionsType]?: string };

interface HDRHTMLCanvasElement extends HTMLCanvasElement {
  configureHighDynamicRange(options: HDRHTMLCanvasOptions): void;
  _getContext(contextId: string, options?: object): RenderingContext | null;
}

interface HDRImageData {
  readonly colorSpace: PredefinedColorSpace;
  readonly data: Uint8ClampedArray | Uint16Array;
  readonly height: number;
  readonly width: number;
}

// See https://github.com/w3c/ColorWeb-CG/blob/main/hdr_html_canvas_element.md
// "rec2100-display-linear" is left out beacause of mapping issues
type HDRPredefinedColorSpace =
  | "display-p3"
  | "srgb"
  | "rec2100-hlg"
  | "rec2100-pq";

//enum HDRPredefinedColorSpace {"display-p3", "srgb", "rec2100-hlg", "rec2100-pq", "rec2100-display-linear"};
