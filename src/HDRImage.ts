//import type { ImageData } from "./types/ImageData.d.ts";
import type { HDRPredefinedColorSpace, HDRImageData, HDRImageDataArray, HDRImagePixelCallback } from "./types/HDRCanvas.d.ts";

import type { ColorTypes } from "colorjs.io";

//import { Uint16Image } from "./Uint16Image";
//import { Float16Image } from "./Float16Image";
import { getBrowserVersion } from "./browser-util";

//export abstract class HDRImage<Format extends ImageDataArray> {
export abstract class HDRImage {
  /** The default color space for new images, set to "rec2100-hlg". */
  static DEFAULT_COLORSPACE: HDRPredefinedColorSpace = "rec2100-hlg";

  /** A multiplier used for scaling 8-bit SDR values to 16-bit. */
  static SDR_MULTIPLIER = 2 ** 16 - 1; //(2**16 - 1)

  /** A mapping of predefined HDR color space names to their corresponding `colorjs.io` string representations. */
  static COLORSPACES: Record<HDRPredefinedColorSpace, ColorTypes> = {
    "rec2100-hlg": "rec2100hlg",
    "display-p3": "p3",
    srgb: "sRGB",
    "rec2100-pq": "rec2100pq"
  };

  /** The raw pixel data stored as a `Float16Array`. */
  data: HDRImageDataArray;

  /** The height of the image in pixels. */
  height: number;
  /** The width of the image in pixels. */
  width: number;

  constructor(width: number, height: number) {
    this.height = height;
    this.width = width;
  }

  /*
  static newInstance(width: number, height: number, colorspace?: string, pixelFormat?: string) {
    const browserMajorVersion = getBrowserVersion();
    if (browserMajorVersion !== null && browserMajorVersion < 137) {
      return new Uint16Image(width, height, colorspace);
    } else {
      return new Float16Image(width, height, colorspace, pixelFormat);
    }
  }
  */

  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  static fromImageData(imageData: HDRImageData | ImageData): HDRImage {
    throw new Error("Method not implemented!");
  }

  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  static async loadSDRImageData(url: URL): Promise<HDRImageData | ImageData | undefined> {
    throw new Error("Method not implemented!");
  }

  /**
   * Retrieves the pixel data at a specified coordinate.
   *
   * @param {number} w - The x-coordinate (width).
   * @param {number} h - The y-coordinate (height).
   * @returns {Float16Array} A new `Float16Array` containing the R, G, B, and A values of the pixel.
   */
  getPixel(w: number, h: number): HDRImageDataArray {
    const pos = (h * this.width + w) * 4;

    return this.data.slice(pos, pos + 4);
  }

  /**
   * Sets the pixel data at a specified coordinate.
   *
   * @param {number} w - The x-coordinate (width).
   * @param {number} h - The y-coordinate (height).
   * @param {number[]} px - An array of four numbers representing the R, G, B, and A channels.
   */
  setPixel(w: number, h: number, px: number[]): void {
    const pos = (h * this.width + w) * 4;
    this.data[pos + 0] = px[0];
    this.data[pos + 1] = px[1];
    this.data[pos + 2] = px[2];
    this.data[pos + 3] = px[3];
  }

  abstract setImageData(imageData: HDRImageData | ImageData): void;
  abstract getImageData(): ImageData | null;

  abstract fill(color: number[]): this | undefined;
  abstract pixelCallback(fn: HDRImagePixelCallback): void;

  /**
   * Creates a deep clone of the current `Uint16Image` instance.
   *
   * @returns {Uint16Image} A new `Uint16Image` instance with a copy of the data.
   * @private
   */
  clone(): this {
    // Was Uint16Image
    const copy = Object.create(Object.getPrototypeOf(this));
    Object.assign(copy, this);
    return copy;
  }
}

/*
function processImage(data: ImageDataArray) {
  if (data instanceof Uint8ClampedArray) {
    // handle Uint8ClampedArray
  } else if (data instanceof Float16Array) {
    // handle Float16Array
  }
}
*/
