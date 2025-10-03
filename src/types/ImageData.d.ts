export {};

declare global {

  var ImageDataSettings: {
    prototype: ImageDataSettings;
    pixelFormat?: ImageDataPixelFormat;
  }

  var ImageData: {
      prototype: ImageData;
      pixelFormat: ImageDataPixelFormat;
  }

  type ImageDataArray = Uint8ClampedArray | Float16Array;

  type ImageDataPixelFormat = "rgba-unorm8" | "rgba-float16";

}
