# `hdr-canvas` 0.1.0

# Introduction

Since the last release many areas of handling HDR contet in the browser have evolved.
Most notably is certainly the introduction of the `Float16Array` in the `ImageData` construtor:

- The [WhatWG spec](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#imagedataarray), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData#syntax) and [BCD](https://github.com/mdn/browser-compat-data/issues/27547)) have been updated accordingly. You can test your own browser using `new ImageData(new Float16Array(4), 1, 1, {pixelFormat:"rgba-float16"})`.
  - Still open in [Firefox](https://bugzil.la/1958830)
  - Hidden behind flag in [Safari](https://webkit.org/b/291196)
  - Chromium has implemented it starting with [137](https://source.chromium.org/chromium/chromium/src/+/refs/tags/137.0.7104.0:third_party/blink/renderer/core/html/canvas/image_data.idl): \*\*The `ImageData` constructor only acceppts `Float16Array` instead of `Uint16Array`. This makes older versions of this modue obsolute, since they targeted the chromium specific solution.
  - If Safari enables it by default it will be also in the [Typescript DOM types](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2107)

As [@reitowo](https://github.com/reitowo) pointed out, there has been a change to the `getContext("2d")` method. The key `pixelFormat` has been replaced by `colorType`.

In parallel threre have been changes to the UltraHDR image format, especially te encoding of gain map matadata. While this used to be don in XMP it's now done according to ISO 21496-1. This ihas been adopted by Google and Apple in newer OS versions like Android 15 and iOS 18 to avoid cross-platform fragmentation. The [UltraHDR Library](https://github.com/google/libultrahdr) has already changed to ussin the [ISO format as default](https://github.com/google/libultrahdr/blob/main/docs/building.md).

Currently the ThreeJS UHDR loader doesn't know how to handle this change, see [mrdoob/three.js#32293](https://github.com/mrdoob/three.js/issues/32293).

# Key Changes & New Features

- Better support for official Web-APIs
  - Use `Float16Array` instead of `Uint16Array`
  - Use the correct option for initializing 2D canvas context

## Improved Documentation

The documentation have been greatly improved, there is now also a [site](https://cmahnke.github.io/hdr-canvas/) including the examples and API docs.

## Examples

The examples from the blog are now part of this repository:

- [`tests/site/assets/ts/hdr-three.js.ts`](tests/site/assets/ts/hdr-three.js.ts) - Three JS with HDR texture
- [`tests/site/assets/ts/image-slider.ts`](tests/site/assets/ts/image-slider.ts) - Generated HDR content
- [`tests/site/assets/ts/main.ts`](tests/site/assets/ts/main.ts) - feature detection

These example are also avalable on the new [documentation site](https://cmahnke.github.io/hdr-canvas/)

## Advocacy

Since the changes by the WhatWG weren't picked up already there had to be some Issues in the relevant repos to be raised.

- [mdn/content#40639](https://github.com/mdn/content/issues/40639)
- [mdn/browser-compat-data#27547](https://github.com/mdn/browser-compat-data/issues/27547)
- [microsoft/TypeScript-DOM-lib-generator#2107](https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/2107)
- [mrdoob/three.js#32293](https://github.com/mrdoob/three.js/issues/32293).
