export function checkHDR(): boolean {
  try {
    const bitsPerChannel: number = screen.colorDepth / 3;
    const hdrSupported: boolean = bitsPerChannel > 8;

    //TODO: Test if this works as expected
    const dynamicRangeHighMQ: boolean = window.matchMedia(
      "(dynamic-range: high)",
    ).matches;
    const colorGamutMQ: boolean =
      window.matchMedia("(color-gamut: rec2020)").matches ||
      window.matchMedia("(color-gamut: p3)").matches;
    if (colorGamutMQ && dynamicRangeHighMQ) {
      if (bitsPerChannel !== Math.round(bitsPerChannel)) {
        // iOS bug
        return false;
      } else if (hdrSupported) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  } catch (e) {
    /* eslint-disable no-console */
    console.error("Bad window.screen test", e);
    /* eslint-enable */
    return false;
  }
}

export function checkHDRCanvas(): boolean {
  const colorSpace: string = "rec2100-pq";

  try {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    if (!canvas.getContext) {
      return false;
    }
    const ctx: CanvasRenderingContext2D | null = <CanvasRenderingContext2D>(
      canvas.getContext("2d", {
        colorSpace: colorSpace,
        pixelFormat: "float16",
      })
    );
    //canvas.drawingBufferColorSpace = colorSpace;
    //canvas.unpackColorSpace = colorSpace;
    if (ctx === null) {
      return false;
    }
    return true;
    /* eslint-disable no-console, @typescript-eslint/no-unused-vars */
  } catch (e) {
    //console.error("Bad canvas ColorSpace test", e);
    console.error(
      "Bad canvas ColorSpace test - make sure that the Chromium browser flag 'enable-experimental-web-platform-features' has been enabled",
    );

    return false;
  }
  /* eslint-enable */
}
