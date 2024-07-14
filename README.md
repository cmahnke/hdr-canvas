# `hdr-canvas`

This Module contains a collection of functions and classes to work with the HDR support for HTML `canvas` elements i chrome based browsers.
**This should only be considered as proof of concept or alpha code, don't use it in production environments!**

**Especially operations on the `ImageData` arrays are not optimized, e.g. quite slow.**

# Feature detection

Import the required function(s):

```javascript
import { checkHDR, checkHDRCanvas } from "hdr-canvas";
```

## Examples `checkHDRCanvas()`

The functions return `true` if HDR is supported, example:

```javascript
const canvas = document.getElementById("canvas");
if (checkHDRCanvas()) {
  canvas.configureHighDynamicRange({ mode: "extended" });
} else {
  console.debug("hdr not supported");
  return;
}
```

## Example `checkHDRCanvas()`

```javascript
if (checkHDRCanvas()) {
  hdrCanvas.innerText = "HDR Canvas are supported";
  hdrCanvas.style.color = "green";
} else {
  hdrCanvas.innerText = "HDR Canvas are not supported";
  hdrCanvas.style.color = "red";
}
```

# Canvas

The HDR `canvas` support is activated by initializing a canvas context using the following snippet:

```javascript
const colorSpace = "rec2100-hlg";
canvas.configureHighDynamicRange({ mode: "extended" });
const ctx = canvas.getContext("2d", {
  colorSpace: colorSpace,
  pixelFormat: "float16",
});
```

## Canvas setup

The snippet above is also available as function:

```javascript
import { initHDRCanvas } from "hdr-canvas";
```

## Importing `Uint16Image`

Afterwards one can use [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) with a `float16` array, first the `Uint16Image` needs to be imported:

```javascript
import { Uint16Image } from "hdr-canvas";
```

## Example: Loading an image

Thisexample assumes `image` to be a [HTMLImageElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement) including an existing image.

```javascript
const offscreen = new OffscreenCanvas(image.width, image.height);
const loadCtx = offscreen.getContext("2d");
loadCtx.drawImage(image, 0, 0);
const imData = loadCtx.getImageData(0, 0, image.width, image.height);
console.log(imData);

var hdrCanvas = document.createElement("canvas");
hdrCanvas.width = image.width;
hdrCanvas.height = image.height;

const rec210hglImage = Uint16Image.fromImageData(imData);

const ctx = initHDRCanvas(hdrCanvas);
ctx.putImageData(rec210hglImage.getImageData(), 0, 0);
```

# Three.js WebGPU

**Note**: Make sure to have Three.js added as a dependency.

This is just a drop in replacement for the regular `WebGPURenderer` of Three.js.

```javascript
import HDRWebGPURenderer from "hdr-canvas/three/HDRWebGPURenderer.js";
```

Use it as you'll do with a `WebGPURenderer`.

```javascript
renderer = new HDRWebGPURenderer({ canvas: canvas, antialias: true });
```

# Example

See [this](https://christianmahnke.de/en/post/hdr-image-analysis/) blog post for an example in action, requires a Chromium based browser and a HDR-enable monitor.

---

# TODO

The following things might be improved:

- Try to detect change of screen for HDR detection
- Improve speed
  - Provide WebWorker
