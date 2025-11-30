import { HDRImage } from "./HDRImage";

import Color from "colorjs.io";
import type { Coords } from "colorjs.io";
import { f16round } from "@petamoriken/float16";

import type { HDRPredefinedColorSpace, HDRImageData, HDRImagePixelCallback } from "./types/HDRCanvas.d.ts";

/**
 * Represents an image using a `Float16Array` for its pixel data,
 * providing support for high dynamic range (HDR) color spaces.
 */
export class Float16Image extends HDRImage {
  /** The raw pixel data stored as a `Float16Array`. */
  data: Float16Array;

  /** The default pixel format for new images, set to "rgba-float16". */
  static DEFAULT_PIXELFORMAT: ImageDataPixelFormat = "rgba-float16";

  /** The color space of the image. */
  colorSpace: HDRPredefinedColorSpace;
  /** The pixel format of the image - usualy 'rgba-float16'. */
  pixelFormat: ImageDataPixelFormat;

  /**
   * Creates a new `Float16Image` instance.
   *
   * @param {number} width - The width of the image in pixels.
   * @param {number} height - The height of the image in pixels.
   * @param {string} [colorspace] - The color space to use for the image. Defaults to `HDRImage.DEFAULT_COLORSPACE`.
   * @param {string} [pixelFormat] - The pixel format to use for the image. Defaults to `DEFAULT_PIXELFORMAT`.
   */
  constructor(width: number, height: number, colorspace?: string, pixelFormat?: string) {
    super(width, height);
    if (colorspace === undefined || colorspace === null) {
      this.colorSpace = Float16Image.DEFAULT_COLORSPACE;
    } else {
      this.colorSpace = colorspace as HDRPredefinedColorSpace;
    }

    if (pixelFormat === undefined || pixelFormat === null || (pixelFormat !== "rgba-unorm8" && pixelFormat !== "rgba-float16")) {
      pixelFormat = Float16Image.DEFAULT_PIXELFORMAT;
    }
    this.pixelFormat = pixelFormat as ImageDataPixelFormat;
    this.data = new Float16Array(height * width * 4);
  }

  /**
   * Fills the entire image with a single color.
   *
   * @param {number[]} color - An array of four numbers representing the R, G, B, and A channels (0-65535).
   * @returns {Float16Image | undefined} The `Float16Image` instance for method chaining, or `undefined` if the color array is invalid.
   */
  fill(color: number[]): this | undefined {
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

  // Only use this for alpha, since it doesn't to color space conversions
  /**
   * Scales an 8-bit value to a 16-bit value. This is typically used for the alpha channel.
   *
   * @param {number} val - The 8-bit value to scale (0-255).
   * @returns {number} The corresponding 16-bit value.
   */
  static scaleUint8ToFloat16(val: number): number {
    return (val << 8) | val;
  }

  // See https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/html/canvas/image_data.idl
  /**
   * Creates a standard `ImageData` object from the `Float16Image` data.
   *
   * @returns {ImageData | null} An `ImageData` object, or `null` if the data is undefined.
   */
  getImageData(): ImageData | null {
    if (this.data === undefined || this.data === null) {
      return null;
    }

    return new ImageData(this.data as unknown as ImageDataArray, this.width, this.height, {
      colorSpace: this.colorSpace as PredefinedColorSpace,
      pixelFormat: this.pixelFormat as ImageDataPixelFormat
    } as ImageDataSettings) as ImageData;
  }

  /**
   * Converts a single 8-bit pixel (from sRGB color space) to a 16-bit pixel
   * in the `rec2100-hlg` color space.
   *
   * @param {Uint8ClampedArray} pixel - An array of four 8-bit numbers (R, G, B, A).
   * @returns {Float16Array} The converted 16-bit pixel in the `rec2100-hlg` color space.
   * @deprecated
   */
  static convertPixelToRec2100_hlg(pixel: Uint8ClampedArray): Float16Array {
    const colorJScolorSpace = <string>Float16Image.COLORSPACES["rec2100-hlg" as HDRPredefinedColorSpace];

    const srgbColor = new Color(
      "srgb",
      Array.from(pixel.slice(0, 3)).map((band: number) => {
        return band / 255;
      }) as Coords,
      pixel[3] / 255
    );
    const rec2100hlgColor = srgbColor.to(colorJScolorSpace);
    const hlg: Array<number> = rec2100hlgColor.coords.map((band: number) => {
      return Math.round(band * Float16Image.SDR_MULTIPLIER);
    });
    // Readd alpha
    hlg.push(rec2100hlgColor.alpha * Float16Image.SDR_MULTIPLIER);

    return Float16Array.from(hlg);
  }

  /**
   * Converts a `Uint8ClampedArray` of sRGB pixel data to a `Float16Array`
   * of pixels in the `rec2100-hlg` color space.
   *
   * @param {Uint8ClampedArray} data - The array of 8-bit pixel data.
   * @returns {Float16Array} The converted 16-bit pixel data.
   */
  static convertArrayToRec2100_hlg(data: Uint8ClampedArray): Float16Array {
    const float16Array = new Float16Array(data.length);

    for (let i = 0; i < data.length; i++) {
      const normalizedFloat = data[i] / 255.0;
      float16Array[i] = f16round(normalizedFloat);
    }

    return float16Array;
  }

  /**
   * Iterates through each pixel of the image and applies a callback function to its data.
   *
   * @param {HDRPixelCallback} fn - The callback function to apply to each pixel.
   */
  pixelCallback(fn: HDRImagePixelCallback) {
    for (let i = 0; i < this.data.length; i += 4) {
      const pixel = fn(this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]);

      //TODO: Check if we should implicitly should operate on int pixel vaulues
      /*
      for (let i = 0; i < pixel.length; i++) {
        const normalizedFloat = pixel[i] / 255.0;
        pixel[i] = f16round(normalizedFloat);
      }
      */

      this.data.set(pixel, i);
    }
  }

  /**
   * Creates a `Float16Image` instance from an `HDRImageData` object.
   *
   * @param {HDRImageData} imageData - The image data to use.
   * @returns {Float16Image} The new `Float16Image` instance.
   * @throws {Error} If the color space of the `HDRImageData` is not supported.
   */
  static fromImageData(imageData: HDRImageData): Float16Image {
    const i = new Float16Image(imageData.width, imageData.height);
    if (imageData.colorSpace == "srgb") {
      i.data = Float16Image.convertArrayToRec2100_hlg(<Uint8ClampedArray>imageData.data);
    } else if (imageData.colorSpace == HDRImage.DEFAULT_COLORSPACE) {
      i.data = <Float16Array>imageData.data;
    } else {
      throw new Error(`ColorSpace ${imageData.colorSpace} isn't supported!`);
    }
    return i;
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
  static fromImageDataArray(
    width: number,
    height: number,
    imageDataArray: Uint8ClampedArray | Uint8ClampedArray<ArrayBufferLike>
  ): Float16Image {
    //const colorSpace == "srgb";
    const i = new Float16Image(width, height);
    //if (imageData.colorSpace == "srgb") {
    i.data = Float16Image.convertArrayToRec2100_hlg(<Uint8ClampedArray>imageDataArray);
    // } else if (imageData.colorSpace == HDRImage.DEFAULT_COLORSPACE) {
    //   i.data = <Float16Array>imageData.data;
    // } else {
    //   throw new Error(`ColorSpace ${imageData.colorSpace} isn't supported!`);
    // }
    return i;
  }

  /**
   * Loads an image from a URL and creates a `Float16Image` instance from it.
   *
   * @param {URL} url - The URL of the image to load.
   * @returns {Promise<Float16Image | undefined>} A promise that resolves with a `Float16Image` instance, or `undefined` if the image could not be loaded.
   */
  static async fromURL(url: URL): Promise<Float16Image | undefined> {
    return Float16Image.loadSDRImageData(url).then((data: HDRImageData | undefined) => {
      if (data !== undefined) {
        return Float16Image.fromImageData(data);
      }
    });
  }

  /**
   * Sets the image data of the current `Float16Image` instance.
   *
   * @param {HDRImageData} imageData - The image data to set.
   * @throws {Error} If the color space of the `HDRImageData` is not supported.
   */
  setImageData(imageData: HDRImageData): void {
    this.width = imageData.width;
    this.height = imageData.height;
    if (imageData.colorSpace == "srgb") {
      this.data = Float16Image.convertArrayToRec2100_hlg(<Uint8ClampedArray>imageData.data);
    } else if (imageData.colorSpace == HDRImage.DEFAULT_COLORSPACE) {
      this.data = <Float16Array>imageData.data;
    } else {
      throw new Error(`ColorSpace ${imageData.colorSpace} isn't supported!`);
    }
    this.colorSpace = HDRImage.DEFAULT_COLORSPACE;
  }

  /**
   * Creates a deep clone of the current `Float16Image` instance.
   *
   * @returns {Float16Image} A new `Float16Image` instance with a copy of the data.
   * @private
   */
  clone(): this {
    const c = new Float16Image(this.width, this.height, this.colorSpace, this.pixelFormat);
    c.data = this.data.slice();
    return c as this;
  }
}
