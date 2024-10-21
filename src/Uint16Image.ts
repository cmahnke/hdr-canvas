import Color from "colorjs.io";
import type { Coords, ColorTypes } from "colorjs.io";

import type { HDRPredefinedColorSpace, HDRImageData } from "./types/HDRCanvas.d.ts";

type Uint16ImagePixelCallback = (red: number, green: number, blue: number, alpha: number) => Uint16Array;

/*
interface ColorSpaceMapping {
  [key: HDRPredefinedColorSpace]: string
}
*/

export class Uint16Image {
  height: number;
  width: number;
  data: Uint16Array;
  static DEFAULT_COLORSPACE: HDRPredefinedColorSpace = "rec2100-hlg";
  static SDR_MULTIPLIER = 2 ** 16 - 1; //(2**16 - 1)
  static COLORSPACES: Record<HDRPredefinedColorSpace, ColorTypes> = {
    "rec2100-hlg": "rec2100hlg",
    "display-p3": "p3",
    srgb: "sRGB",
    "rec2100-pq": "rec2100pq"
  };
  colorSpace: HDRPredefinedColorSpace;

  constructor(width: number, height: number, colorspace?: string) {
    if (colorspace === undefined || colorspace === null) {
      this.colorSpace = Uint16Image.DEFAULT_COLORSPACE;
    } else {
      this.colorSpace = colorspace as HDRPredefinedColorSpace;
    }

    this.height = height;
    this.width = width;
    this.data = new Uint16Array(height * width * 4);
  }

  fill(color: number[]): Uint16Image | undefined {
    if (color.length != 4) {
      return;
    }
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = color[0];
      this.data[i + 1] = color[1];
      this.data[i + 2] = color[2];
      this.data[i + 3] = color[3];
    }
    return this;
  }

  getPixel(w: number, h: number): Uint16Array {
    const pos = (h * this.width + w) * 4;

    return this.data.slice(pos, pos + 4);
  }

  setPixel(w: number, h: number, px: number[]): void {
    const pos = (h * this.width + w) * 4;
    this.data[pos + 0] = px[0];
    this.data[pos + 1] = px[1];
    this.data[pos + 2] = px[2];
    this.data[pos + 3] = px[3];
  }

  // Only use this for alpha, since it doesn't to color space conversions
  static scaleUint8ToUint16(val: number): number {
    return (val << 8) | val;
  }

  getImageData(): ImageData | null {
    if (this.data === undefined || this.data === null) {
      return null;
    }
    return new ImageData(this.data as unknown as Uint8ClampedArray, this.width, this.height, {
      colorSpace: this.colorSpace as PredefinedColorSpace
    });
  }

  static convertPixelToRec2100_hlg(pixel: Uint8ClampedArray): Uint16Array {
    const colorJScolorSpace = <string>Uint16Image.COLORSPACES["rec2100-hlg" as HDRPredefinedColorSpace];

    const srgbColor = new Color(
      "srgb",
      Array.from(pixel.slice(0, 3)).map((band: number) => {
        return band / 255;
      }) as Coords,
      pixel[3] / 255
    );
    const rec2100hlgColor = srgbColor.to(colorJScolorSpace);
    const hlg: Array<number> = rec2100hlgColor.coords.map((band: number) => {
      return Math.round(band * Uint16Image.SDR_MULTIPLIER);
    });
    // Readd alpha
    hlg.push(rec2100hlgColor.alpha * Uint16Image.SDR_MULTIPLIER);

    return Uint16Array.from(hlg);
  }

  static convertArrayToRec2100_hlg(data: Uint8ClampedArray): Uint16Array {
    const uint16Data = new Uint16Array(data.length);
    for (let i = 0; i < data.length; i += 4) {
      const rgbPixel: Uint8ClampedArray = data.slice(i, i + 4);
      const pixel = Uint16Image.convertPixelToRec2100_hlg(rgbPixel);
      uint16Data.set(pixel, i);
    }
    return uint16Data;
  }

  pixelCallback(fn: Uint16ImagePixelCallback) {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data.set(fn(this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]), i);
    }
  }

  static async loadSDRImageData(url: URL): Promise<HDRImageData | undefined> {
    return fetch(url)
      .then((response) => response.blob())
      .then((blob: Blob) => {
        return createImageBitmap(blob);
      })
      .then((bitmap: ImageBitmap) => {
        const { width, height } = bitmap;
        const offscreen = new OffscreenCanvas(width, height);
        const ctx = offscreen.getContext("2d");
        ctx?.drawImage(bitmap, 0, 0);
        return ctx;
      })
      .then((ctx: OffscreenCanvasRenderingContext2D | null) => {
        return ctx?.getImageData(0, 0, ctx?.canvas.width, ctx?.canvas.height);
      });
  }

  static fromImageData(imageData: HDRImageData): Uint16Image {
    const i = new Uint16Image(imageData.width, imageData.height);
    if (imageData.colorSpace == "srgb") {
      i.data = Uint16Image.convertArrayToRec2100_hlg(<Uint8ClampedArray>imageData.data);
    } else if (imageData.colorSpace == Uint16Image.DEFAULT_COLORSPACE) {
      i.data = <Uint16Array>imageData.data;
    } else {
      throw new Error(`ColorSpace ${imageData.colorSpace} isn't supported!`);
    }
    return i;
  }

  static async fromURL(url: URL): Promise<Uint16Image | undefined> {
    return Uint16Image.loadSDRImageData(url).then((data: HDRImageData | undefined) => {
      if (data !== undefined) {
        return Uint16Image.fromImageData(data);
      }
    });
  }

  setImageData(imageData: HDRImageData): void {
    this.width = imageData.width;
    this.height = imageData.height;
    if (imageData.colorSpace == "srgb") {
      this.data = Uint16Image.convertArrayToRec2100_hlg(<Uint8ClampedArray>imageData.data);
    } else if (imageData.colorSpace == Uint16Image.DEFAULT_COLORSPACE) {
      this.data = <Uint16Array>imageData.data;
    } else {
      throw new Error(`ColorSpace ${imageData.colorSpace} isn't supported!`);
    }
    this.colorSpace = Uint16Image.DEFAULT_COLORSPACE;
  }

  clone(): Uint16Image {
    const i = new Uint16Image(this.width, this.height, this.colorSpace);
    i.data = this.data.slice();
    return i;
  }
}
