import Color from "colorjs.io";
import type { Coords, ColorTypes } from "colorjs.io";

import type { HDRPredefinedColorSpace, HDRImageData } from "./types/HDRCanvas.d.ts";

/**
 * A callback function that receives the red, green, blue, and alpha values of a pixel
 * and returns a new `Uint16Array` with the modified values.
 *
 * @callback Uint16ImagePixelCallback
 * @param {number} red - The red channel value (0-65535).
 * @param {number} green - The green channel value (0-65535).
 * @param {number} blue - The blue channel value (0-65535).
 * @param {number} alpha - The alpha channel value (0-65535).
 * @returns {Uint16Array} A new `Uint16Array` containing the four channel values.
 */
type Uint16ImagePixelCallback = (red: number, green: number, blue: number, alpha: number) => Uint16Array;

/*
interface ColorSpaceMapping {
  [key: HDRPredefinedColorSpace]: string
}
*/

/**
 * Represents an image using a `Uint16Array` for its pixel data,
 * providing support for high dynamic range (HDR) color spaces.
 */
export class Uint16Image {
  /** The height of the image in pixels. */
  height: number;
  /** The width of the image in pixels. */
  width: number;
  /** The raw pixel data stored as a `Uint16Array`. */
  data: Uint16Array;
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
  /** The color space of the image. */
  colorSpace: HDRPredefinedColorSpace;

  /**
   * Creates a new `Uint16Image` instance.
   *
   * @param {number} width - The width of the image in pixels.
   * @param {number} height - The height of the image in pixels.
   * @param {string} [colorspace] - The color space to use for the image. Defaults to `DEFAULT_COLORSPACE`.
   */
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

  /**
   * Fills the entire image with a single color.
   *
   * @param {number[]} color - An array of four numbers representing the R, G, B, and A channels (0-65535).
   * @returns {Uint16Image | undefined} The `Uint16Image` instance for method chaining, or `undefined` if the color array is invalid.
   */
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

  /**
   * Retrieves the pixel data at a specified coordinate.
   *
   * @param {number} w - The x-coordinate (width).
   * @param {number} h - The y-coordinate (height).
   * @returns {Uint16Array} A new `Uint16Array` containing the R, G, B, and A values of the pixel.
   */
  getPixel(w: number, h: number): Uint16Array {
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

  // Only use this for alpha, since it doesn't to color space conversions
  /**
   * Scales an 8-bit value to a 16-bit value. This is typically used for the alpha channel.
   *
   * @param {number} val - The 8-bit value to scale (0-255).
   * @returns {number} The corresponding 16-bit value.
   */
  static scaleUint8ToUint16(val: number): number {
    return (val << 8) | val;
  }

  /**
   * Creates a standard `ImageData` object from the `Uint16Image` data.
   *
   * @returns {ImageData | null} An `ImageData` object, or `null` if the data is undefined.
   */
  getImageData(): ImageData | null {
    if (this.data === undefined || this.data === null) {
      return null;
    }
    return new ImageData(this.data as unknown as Uint8ClampedArray, this.width, this.height, {
      colorSpace: this.colorSpace as PredefinedColorSpace
    });
  }

  /**
   * Converts a single 8-bit pixel (from sRGB color space) to a 16-bit pixel
   * in the `rec2100-hlg` color space.
   *
   * @param {Uint8ClampedArray} pixel - An array of four 8-bit numbers (R, G, B, A).
   * @returns {Uint16Array} The converted 16-bit pixel in the `rec2100-hlg` color space.
   */
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

  /**
   * Converts a `Uint8ClampedArray` of sRGB pixel data to a `Uint16Array`
   * of pixels in the `rec2100-hlg` color space.
   *
   * @param {Uint8ClampedArray} data - The array of 8-bit pixel data.
   * @returns {Uint16Array} The converted 16-bit pixel data.
   */
  static convertArrayToRec2100_hlg(data: Uint8ClampedArray): Uint16Array {
    const uint16Data = new Uint16Array(data.length);
    for (let i = 0; i < data.length; i += 4) {
      const rgbPixel: Uint8ClampedArray = data.slice(i, i + 4);
      const pixel = Uint16Image.convertPixelToRec2100_hlg(rgbPixel);
      uint16Data.set(pixel, i);
    }
    return uint16Data;
  }

  /**
   * Iterates through each pixel of the image and applies a callback function to its data.
   *
   * @param {Uint16ImagePixelCallback} fn - The callback function to apply to each pixel.
   */
  pixelCallback(fn: Uint16ImagePixelCallback) {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data.set(fn(this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]), i);
    }
  }

  /**
   * Loads an SDR image from a URL and returns its image data.
   *
   * @param {URL} url - The URL of the image to load.
   * @returns {Promise<HDRImageData | undefined>} A promise that resolves with the `HDRImageData` or `undefined` if loading fails.
   */
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

  /**
   * Creates a `Uint16Image` instance from an `HDRImageData` object.
   *
   * @param {HDRImageData} imageData - The image data to use.
   * @returns {Uint16Image} The new `Uint16Image` instance.
   * @throws {Error} If the color space of the `HDRImageData` is not supported.
   */
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

  /**
   * Loads an image from a URL and creates a `Uint16Image` instance from it.
   *
   * @param {URL} url - The URL of the image to load.
   * @returns {Promise<Uint16Image | undefined>} A promise that resolves with a `Uint16Image` instance, or `undefined` if the image could not be loaded.
   */
  static async fromURL(url: URL): Promise<Uint16Image | undefined> {
    return Uint16Image.loadSDRImageData(url).then((data: HDRImageData | undefined) => {
      if (data !== undefined) {
        return Uint16Image.fromImageData(data);
      }
    });
  }

  /**
   * Sets the image data of the current `Uint16Image` instance.
   *
   * @param {HDRImageData} imageData - The image data to set.
   * @throws {Error} If the color space of the `HDRImageData` is not supported.
   */
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

  /**
   * Creates a deep clone of the current `Uint16Image` instance.
   *
   * @returns {Uint16Image} A new `Uint16Image` instance with a copy of the data.
   * @private
   */
  clone(): Uint16Image {
    const i = new Uint16Image(this.width, this.height, this.colorSpace);
    i.data = this.data.slice();
    return i;
  }
}
