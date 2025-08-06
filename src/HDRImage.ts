import { Uint16Image } from "./Uint16Image";
import { Float16Image } from "./Float16Image";
import { getBrowserVersion } from "./browser-util";

export class HDRImage {
  static newInstance(width: number, height: number, colorspace?: string, pixelFormat?: string) {
    const browserMajorVersion = getBrowserVersion();
    if (browserMajorVersion !== null && browserMajorVersion < 137) {
      return new Uint16Image(width, height, colorspace);
    } else {
      return new Float16Image(width, height, colorspace, pixelFormat);
    }
  }
}
