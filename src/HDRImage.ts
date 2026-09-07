//import type { ImageData } from "./types/ImageData.d.ts";
import type { HDRPredefinedColorSpace, HDRImageData, HDRImageDataArray, HDRImagePixelCallback } from "./types/HDRCanvas.d.ts";

export abstract class HDRImage {
  /** The default color space for new images, set to "rec2100-hlg". */
  static DEFAULT_COLORSPACE: HDRPredefinedColorSpace = "rec2100-hlg";

  /** A multiplier used for scaling 8-bit SDR values to 16-bit. */
  static SDR_MULTIPLIER = 2 ** 16 - 1; //(2**16 - 1)

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

  /**
   * Loads an SDR image from a URL and returns its image data.
   *
   * @param {URL} url - The URL of the image to load.
   * @returns {Promise<ImageData | undefined>} A promise that resolves with the `HDRImageData` or `undefined` if loading fails.
   */
  static async loadSDRImageData(url: URL): Promise<ImageData | undefined> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to load image from ${url}: ${response.status} ${response.statusText}`);
        return undefined;
      }
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      const { width, height } = bitmap;
      const offscreen = new OffscreenCanvas(width, height);
      const ctx = offscreen.getContext("2d");
      ctx!.drawImage(bitmap, 0, 0);
      return ctx!.getImageData(0, 0, width, height);
    } catch (e) {
      console.error(`Failed to load image from ${url}`, e);
      return undefined;
    }
  }

  /**
   * Retrieves the pixel data at a specified coordinate.
   *
   * @param {number} w - The x-coordinate (width).
   * @param {number} h - The y-coordinate (height).
   * @returns {Float16Array} A new `Float16Array` containing the R, G, B, and A values of the pixel.
   * @throws {RangeError} If the coordinates are outside of the image bounds.
   */
  getPixel(w: number, h: number): HDRImageDataArray {
    if (w < 0 || w >= this.width || h < 0 || h >= this.height) {
      throw new RangeError(`Pixel coordinates (${w}, ${h}) are outside of the image bounds (${this.width}x${this.height})`);
    }
    const pos = (h * this.width + w) * 4;

    return this.data.slice(pos, pos + 4);
  }

  /**
   * Sets the pixel data at a specified coordinate.
   *
   * @param {number} w - The x-coordinate (width).
   * @param {number} h - The y-coordinate (height).
   * @param {number[]} px - An array of four numbers representing the R, G, B, and A channels.
   * @throws {RangeError} If the coordinates are outside of the image bounds.
   */
  setPixel(w: number, h: number, px: number[]): void {
    if (w < 0 || w >= this.width || h < 0 || h >= this.height) {
      throw new RangeError(`Pixel coordinates (${w}, ${h}) are outside of the image bounds (${this.width}x${this.height})`);
    }
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
   * Creates a deep clone of the current `HDRImage` instance.
   *
   * @returns {HDRImage} A new instance of the same class with a copy of the data.
   * @private
   */
  clone(): this {
    const copy = Object.create(Object.getPrototypeOf(this)) as this;
    Object.assign(copy, this);
    copy.data = this.data.slice() as HDRImageDataArray;
    return copy;
  }
}
