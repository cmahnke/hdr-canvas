# `hdr-canvas` 0.1.1

# Introduction

Since the last release many areas of handling HDR content in the browser have evolved. This also applies for WebGPU renderings using ThreeJS

The changes in initializing a `canvas for a Rendere are described in the [explainer](https://github.com/ccameron-chromium/webgpu-hdr/blob/main/EXPLAINER.md).

The important change is the renaming from `colorMetadata` to:

```
toneMapping: { mode: "extended" }
```

This is also reflected by the ThreeJS API so a custom HDR WebGPU Renderer and Backend aren't strictly needed anymore. They will be removed soon.

# Key Changes & New Features

- Fix ThreeJS HDR Renderer and Backend
