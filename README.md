# `hdr-canvas`

This module contains a collection of functions and classes to work with the HDR support for HTML `canvas` elements in chromium based (like Chrome, Edge, Opera and Brave) browsers.

**This should only be considered as proof of concept or alpha code, don't use it in production environments!**

**Even if the display of HDR images works, the HDR support for the `canvas` element needs the browser flag `enable-experimental-web-platform-features` to be enabled. For example, open chrome://flags#enable-experimental-web-platform-features in Chrome to activate it.**

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

This can be useful to add a warning (using the [`fillText()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText) method) to the canvas if it doesn't support HDR content.

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

**Note: Currently the Chrome flag `enable-experimental-web-platform-features` needs to be enabled to have HDR support for the `canvas` element. You need to tell your visitors about that.**

The HDR `canvas` support is activated by initializing a canvas context using the following snippet:

```javascript
const colorSpace = "rec2100-hlg";
canvas.configureHighDynamicRange({ mode: "extended" });
const ctx = canvas.getContext("2d", {
  colorSpace: colorSpace,
  pixelFormat: "float16"
});
```

## Canvas setup

The snippet above is also available as function:

```javascript
import { initHDRCanvas } from "hdr-canvas";
```

## Implicit Canvas setup

It's now also possible to use a HDR enabled Canvas by wrapping the browser internal `getContext()` function, by calling `defaultGetContextHDR()`.

```javascript
import {defaultGetContextHDR, checkHDR, checkHDRCanvas} from 'hdr-canvas';

if (checkHDR() && checkHDRCanvas()) {
  defaultGetContextHDR();
  console.log('Enabled HDR Canvas');
}
```

**Note:** This example wraps the call to `defaultGetContextHDR()` into a check (`checkHDR() && checkHDRCanvas()`), because calling the function in a browser that isn't HDR-capable will break every subsequent call to `getContext()`.

## Resetting default HDR canvas

Use the method `resetGetContext()` to undo the changes by `defaultGetContextHDR()`.

```javascript
import {resetGetContext} from 'hdr-canvas';

resetGetContext();
```

## Importing `Uint16Image`

Afterwards one can use [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) with a `float16` array, first the `Uint16Image` needs to be imported:

```javascript
import { Uint16Image } from "hdr-canvas";
```

## Example: Loading an image

This example assumes `image` to be a [HTMLImageElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement) including an existing image.

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

This is just a drop-in-replacement for the regular `WebGPURenderer` of Three.js.

```javascript
import HDRWebGPURenderer from "hdr-canvas/three/HDRWebGPURenderer.js";
```

**Note:** Starting Three.js 167 the WebGPU renderer is the new default renderer. This has several consequences for the required imports. Use this import instead of the official one and if your using Vite _don't_ provide an import map of resolver alias configuration.

```
import * as THREE from 'three/src/Three.js';
```

Use it as you'll do with a `WebGPURenderer`.

```javascript
renderer = new HDRWebGPURenderer({ canvas: canvas, antialias: true });
```

## Updating textures

Starting from Three.js version 167 you need to fix imported UHDR Textures, otherwise they will appear black:

```javascript
model = gltf.scene;
model.traverse((element) => {
  if (element?.material?.type != undefined) {
    let targetMaterial = new THREE.MeshBasicMaterial();
    THREE.MeshBasicMaterial.prototype.copy.call(targetMaterial, element.material);
    element.material = targetMaterial;
  }
});
scene.add(model);
```

## Compatibility

This currently doesn't work with Firefox, due to missing support for HDR and only partial WebGPU support.
One can import `WebGPU` and use also a HDR check to guard from errors:

```javascript
import WebGPU from 'hdr-canvas/three/WebGPU.js';
```

Only use the provided renderer if the browser supports WebGPU and HDR:

```javascript
if (WebGPU.isAvailable() && checkHDRCanvas()) {
  renderer = new HDRWebGPURenderer({canvas: canvas, antialias: true});
} else {
  renderer = new THREE.WebGLRenderer({canvas: canvas, antialias: true});
}
```

# Examples

All examples requires a Chromium based browser (like Chrome, Edge, Opera and Brave) and a HDR-enable monitor.

- [Contrast enhancement for UV images using HDR](https://christianmahnke.de/en/post/hdr-image-analysis/)
- [HDR IIIF](https://christianmahnke.de/en/post/hdr-iiif/)
- [Ultraviolet Photogrammetry](https://christianmahnke.de/en/post/uv-photogrammetry/)

---

# TODO

The following things might be improved:

- Change `pixelFormat` in `HTMLCanvasElement.getContext("2d")` to `colorType` (["unorm8", "float16"]) while keeping some downward compatibility
- Try to detect change of screen for HDR detection
- Improve speed
  - Provide WebWorker
- Documentation
  - Link to browser HDR support
  - Document `Uint16Image`

# Notes

This section contains some development related notes which might be helpful for reusing or extending the code.

# Changes to HTMLCanvasElement

## `pixelFormat` to `colorType` ([#151](https://github.com/cmahnke/hdr-canvas/issues/151))

As [@reitowo](https://github.com/reitowo) pointed out, there has been a change to the `getContext("2d")` method. This is currently not implemented

This has been implemented in Chromium 134. Browser type definitions for TypeScript reflecting this change are [marked as unimplemeneted](https://github.com/microsoft/TypeScript-DOM-lib-generator/blob/23819c7e552e9e2b81f8042fa4ea9cf0890acbb3/inputfiles/removedTypes.jsonc#L293)
