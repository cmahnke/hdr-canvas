# `hdr-canvas` 0.1.2

# Introduction

The color scaling of `Float16Image` was off.

This is certainly the last release before the removal:

- of the ThreeJS components, they aren't needed anymore.
- of the Uint16Image it's outdated and only still works since Chrom(e|ium) due to backwards compatibility.
- the support for Chrom(e|ium) < 140
- of the bundle UMD build since ESM is the way to go.

# Key Changes & New Features

- Fix `Float16Image` color scaling
