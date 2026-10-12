/* eslint-disable  @typescript-eslint/no-unused-vars */
import {
  Float16Image,
  checkHDR,
  checkWCG,
  checkDynamicRangeHigh,
  checkColorGamutP3,
  checkColorGamutRec2020,
  checkHDRCanvas,
  checkWCGCanvas,
  getDisplayCapabilities,
  onDisplayChange,
  initHDRCanvas,
  defaultGetContextHDR,
  resetGetContext,
  getHdrOptions,
  getWcgOptions
} from "hdr-canvas";
import HDRWebGPUBackend from "hdr-canvas/three/HDRWebGPUBackend.js";
import HDRWebGPURenderer from "hdr-canvas/three/HDRWebGPURenderer.js";

/* eslint-disable  @typescript-eslint/no-explicit-any */
(window as any).checkHDR = checkHDR;
(window as any).checkWCG = checkWCG;
(window as any).checkDynamicRangeHigh = checkDynamicRangeHigh;
(window as any).checkColorGamutP3 = checkColorGamutP3;
(window as any).checkColorGamutRec2020 = checkColorGamutRec2020;
(window as any).checkHDRCanvas = checkHDRCanvas;
(window as any).checkWCGCanvas = checkWCGCanvas;
(window as any).getDisplayCapabilities = getDisplayCapabilities;
(window as any).onDisplayChange = onDisplayChange;
(window as any).initHDRCanvas = initHDRCanvas;
(window as any).defaultGetContextHDR = defaultGetContextHDR;
(window as any).resetGetContext = resetGetContext;
(window as any).getHdrOptions = getHdrOptions;
(window as any).getWcgOptions = getWcgOptions;

(window as any).HDRWebGPUBackend = HDRWebGPUBackend;
(window as any).HDRWebGPURenderer = HDRWebGPURenderer;
