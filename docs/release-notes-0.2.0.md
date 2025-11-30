# `hdr-canvas` 0.2.0

# Introduction

The following things have been removed:

- the support for Chrom(e|ium) < 140
- `Uint16Image`-
- Utils for browser version check.
- bundled UMD build.

# Key Changes & New Features

- Better support for official Web-APIs
  - Use `Float16Array` instead of `Uint16Array`
  - Use the correct option for initializing 2D canvas context
