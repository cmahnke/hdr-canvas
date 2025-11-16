# `hdr-canvas`

This module contains a collection of functions and classes to work with the HDR support for HTML `canvas` elements in chromium based (like Chrome, Edge, Opera and Brave) browsers.

All changes and a bit of context are part of the [release notes for 0.1.0](docs/release-notes-0.1.0.md).

**This should only be considered as proof of concept or alpha code, don't use it in production environments!**

**Even if the display of HDR images works, the HDR support for the `canvas` element needs the browser flag `enable-experimental-web-platform-features` to be enabled. For example, open chrome://flags#enable-experimental-web-platform-features in Chrome to activate it.**

**Especially operations on the `ImageData` arrays are not optimized, e.g. quite slow.**

# Feature detection

Import the required function(s):

```javascript
import { checkHDR, checkHDRCanvas } from "hdr-canvas";
```

## Example `checkHDRCanvas()`

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
const hdrCanvasStatus = document.getElementById("hdr-check-status")! as HTMLDivElement;
if (checkHDRCanvas()) {
  hdrCanvasStatus.innerText = "HDR Canvas are supported";
  hdrCanvasStatus.style.color = "green";
} else {
  hdrCanvasStatus.innerText = "HDR Canvas are not supported";
  hdrCanvasStatus.style.color = "red";
}
```

## Example `checkHDRVideo()`

```javascript
const hdrCanvasStatus = document.getElementById("hdr-check-status")! as HTMLDivElement;
if (checkHDRVideo()) {
  hdrCanvasStatus.innerText = "HDR Video is supported";
  hdrCanvasStatus.style.color = "green";
} else {
  hdrCanvasStatus.innerText = "HDR Video is not supported";
  hdrCanvasStatus.style.color = "red";
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
  colorType: "float16"
  // Use this for Chrome < 133
  //pixelFormat: "float16"
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
import { defaultGetContextHDR, checkHDR, checkHDRCanvas } from "hdr-canvas";

if (checkHDR() && checkHDRCanvas()) {
  defaultGetContextHDR();
  console.log("Enabled HDR Canvas");
}
```

**Note:** This example wraps the call to `defaultGetContextHDR()` into a check (`checkHDR() && checkHDRCanvas()`), because calling the function in a browser that isn't HDR-capable will break every subsequent call to `getContext()`.

## Resetting default HDR canvas

Use the method `resetGetContext()` to undo the changes by `defaultGetContextHDR()`.

```javascript
import { resetGetContext } from "hdr-canvas";

resetGetContext();
```

## Importing `Float16Image`

Afterwards one can use [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) with a `float16` array, first the `Float16Image` needs to be imported:

```javascript
import { Float16Image } from "hdr-canvas";
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

const rec210hglImage = Float16Image.fromImageData(imData);

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

```javascript
import * as THREE from "three/src/Three.js";
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
import WebGPU from "hdr-canvas/three/WebGPU.js";
```

Only use the provided renderer if the browser supports WebGPU and HDR:

```javascript
if (WebGPU.isAvailable() && checkHDRCanvas()) {
  renderer = new HDRWebGPURenderer({ canvas: canvas, antialias: true });
} else {
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
}
```

# Examples

## Bundled examples

Some of the examples above are also part of this repository.

```console
npm i
npm run dev
```

Open This URL in your browser: [http://localhost:5173/](http://localhost:5173/), you can also access them directly from [GitHub](https://cmahnke.github.io/hdr-canvas/).

## Old examples on my blog:

All examples requires a Chromium based browser (like Chrome, Edge, Opera and Brave) and a HDR-enable monitor.

- [Contrast enhancement for UV images using HDR](https://christianmahnke.de/en/post/hdr-image-analysis/)
- [HDR IIIF](https://christianmahnke.de/en/post/hdr-iiif/)
- [Ultraviolet Photogrammetry](https://christianmahnke.de/en/post/uv-photogrammetry/)

---

# TODO

The following things might be improved:

- [x] Change `pixelFormat` in `HTMLCanvasElement.getContext("2d")` to `colorType` (["unorm8", "float16"]) while keeping some downward compatibility - [#151](https://github.com/cmahnke/hdr-canvas/issues/151)
- [ ] Try to detect change of screen for HDR detection - [#107](https://github.com/cmahnke/hdr-canvas/issues/107)
- [ ] Remove `Uint16Image`
- [ ] Improve speed
  - [ ] Provide WebWorker
- [ ] Documentation
  - [ ] Link to browser HDR support
  - [x] Document `Uint16Image`
- [ ] Tests and examples
  - [x] Provide examples from blog
  - [x] Provide simple sanity tests

# References

## Browser HDR

- [`dynamic-range` Media Query](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/dynamic-range)
- [HDR Capability Detection](https://github.com/w3c/media-capabilities/blob/main/hdr_explainer.md)
- [HDR `HTMLCanvasElement`](https://github.com/w3c/ColorWeb-CG/blob/main/hdr_html_canvas_element.md)

### Older

- [Adding support for High Dynamic Range (HDR) imagery to HTML Canvas: a baseline proposal](https://github.com/whatwg/html/issues/9461)
- [HDR Canvas Example](https://ccameron-chromium.github.io/webgl-examples/canvas-hdr.html)

## Sources

This section contains different definitions, which can be helpful to impkement HDR related things

- [`CanvasRenderingContext2DSettings` in Chromium](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/modules/canvas/canvas2d/canvas_rendering_context_2d_settings.idl)
- [`ImageData` in Chromium](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/html/canvas/image_data.idl)
- [`TypeScript DOM reference`](https://github.com/microsoft/TypeScript-DOM-lib-generator/blob/main/baselines/dom.generated.d.ts)

## Workflow on related changes to web APIs

**This is considered to be experimental**, currently we're waiting for TypeSript to pick up the changes made to the web APIs. See [microsoft/TypeScript-DOM-lib-generator#2107](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2107)

### Along the spec

1. Change to the WhatsWG spec - [Issue Tracker](https://github.com/whatwg/html)
2. Change apporoved
3. MDN picks up spec change - [Create an issue](https://github.com/mdn/content/issues)
4. Changes are popagated to the [TypeScript generated DOM library](https://github.com/microsoft/TypeScript-DOM-lib-generator)

### By custom TypeScript types

1. Extend `src/types`, try to extend existing interfaces

## Generating updated TypeScript types

Starting with one of the next monor versions (maybe 0.2.0) the prefered way is to update the browser / DOM types instead of adding our own HDR types. The existing types will continue to exist for now. This change reflects improvements in browser support and should make transitioning to standard base types later on.

The basic workflow is as follows:

- [Update the definitions](https://github.com/microsoft/TypeScript-DOM-lib-generator?tab=readme-ov-file#contribution-guidelines)
- Regenerate the types (needs the MDN submodule to be checked out)

To make this repaetable add patches to this repository:

Edit the types, for example to change existing definitions, see [Update the definitions](https://github.com/microsoft/TypeScript-DOM-lib-generator?tab=readme-ov-file#contribution-guidelines)

```
cd node_modules/@typescript/dom-lib-generator/
vi inputfiles/overridingTypes.jsonc
```

To generate a patch pmake sure, that the Git submmodule is remove, otherwise `patch-package` will fail.

```
node scripts/git-submodules.js -c -d node_modules/@typescript/dom-lib-generator/
npx patch-package @typescript/dom-lib-generator
```
