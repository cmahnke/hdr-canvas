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
   * Creates a `Float16Image` instance from an `HDRImageData` object.
   *
   * @param {HDRImageData} imageData - The image data to use.
   * @returns {Float16Image} The new `Float16Image` instance.
   * @throws {Error} If the color space of the `HDRImageData` is not supported.
   */
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  static fromImageData(imageData: HDRImageData | ImageData): HDRImage {
    throw new Error("Method not implemented!");
  }

  /**
   * Creates a `Float16Image` instance from an `Uint8ClampedArray` object.
   *
   * @param {number} width - The width of the image.
   * @param {number} height - The height of the image.
   * @param {HDRImageData} imageData - The image data to use.
   * @returns {Float16Image} The new `Float16Image` instance.
   * @throws {Error} If the color space of the `HDRImageData` is not supported.
   */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  static fromImageDataArray(
    width: number,
    height: number,
    imageDataArray: Uint8ClampedArray | Uint8ClampedArray<ArrayBufferLike>
  ): HDRImage {
    throw new Error("Method not implemented!");
  }

  /**
   * Loads an SDR image from a URL and returns its image data.
   *
   * @param {URL} url - The URL of the image to load.
   * @returns {Promise<ImageData | undefined>} A promise that resolves with the `HDRImageData` or `undefined` if loading fails.
   */
  static async loadSDRImageData(url: URL): Promise<ImageData | undefined> {
    return fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        return createImageBitmap(blob);
      })
      .then((bitmap) => {
        const { width, height } = bitmap;
        const offscreen = new OffscreenCanvas(width, height);
        const ctx = offscreen.getContext("2d");
        ctx!.drawImage(bitmap, 0, 0);
        return ctx!.getImageData(0, 0, width, height);
      });
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
