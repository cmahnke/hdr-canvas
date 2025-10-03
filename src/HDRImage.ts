//import type { ImageData } from "./types/ImageData.d.ts";
import type { HDRImageData, HDRImageDataArray, HDRImagePixelCallback } from "./types/HDRCanvas.d.ts";

import { Uint16Image } from "./Uint16Image";
import { Float16Image } from "./Float16Image";
import { getBrowserVersion } from "./browser-util";

//export abstract class HDRImage<Format extends ImageDataArray> {
export abstract class HDRImage {
  /** The height of the image in pixels. */
  height: number;
  /** The width of the image in pixels. */
  width: number;

  constructor(width: number, height: number) {
    this.height = height;
    this.width = width;
  }

  static newInstance(width: number, height: number, colorspace?: string, pixelFormat?: string) {
    const browserMajorVersion = getBrowserVersion();
    if (browserMajorVersion !== null && browserMajorVersion < 137) {
      return new Uint16Image(width, height, colorspace);
    } else {
      return new Float16Image(width, height, colorspace, pixelFormat);
    }
  }

  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  static fromImageData(imageData: HDRImageData | ImageData): HDRImage {
    throw new Error('Method not implemented!');
  }

  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  static async loadSDRImageData(url: URL): Promise<HDRImageData | ImageData | undefined> {
    throw new Error('Method not implemented!');
  }

  abstract setPixel(w: number, h: number, px: number[]): void;
  abstract getPixel(w: number, h: number): HDRImageDataArray;

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
  clone(): this { // Was Uint16Image
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
