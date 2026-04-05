# `hdr-canvas` 0.2.0

# Introduction

The following things have been removed:

- the support for Chrom(e|ium) < 140
- `Uint16Image`
- Utils for browser version check.
- bundled UMD and IIFE builds.
- `colorjs.io` isn't a direct dependency anymore

Support for Safari started (current target is Safari Technology Preview R232 and later): This requires the feature flag "Canvas Color Types and ImageData Pixel Formats". But this currently doesn't support the `rec2100-hlg` color space.

# Key Changes & New Features

- Check function for Float16Array
- `Float16Array` support is no handled by [`@petamoriken/float16`](https://www.npmjs.com/package/@petamoriken/float16)

# Removal of [`colorjs.io`](https://colorjs.io/)

Even though `colorjs.io` is quite helpful for color space conversions, it's increases the size of a package considerably. And since there are other packages to handle the `Float16`, the package has been removed. If you need your own conversions, add it to your project:

```
npm install colorjs.io
```
