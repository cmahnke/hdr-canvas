# `hdr-canvas` 0.2.0

# Introduction

The following things have been removed:

- the support for Chrom(e|ium) < 140
- `Uint16Image`
- Utils for browser version check.
- bundled UMD build.

Support for Safari started (current target is Safari Technology Preview R232): This requires the feature flag "Canvas Color Types and ImageData Pixel Formats". But this currently doesn't support the `rec2100-hlg` color space.

# Key Changes & New Features

- Check function for Float16Array
