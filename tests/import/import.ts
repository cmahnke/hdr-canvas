/* eslint-disable  @typescript-eslint/no-unused-vars */
import { Uint16Image, checkHDR, checkHDRCanvas, initHDRCanvas, defaultGetContextHDR, resetGetContext } from "hdr-canvas";
import HDRWebGPUBackend from "hdr-canvas/three/HDRWebGPUBackend.js";
import HDRWebGPURenderer from "hdr-canvas/three/HDRWebGPURenderer.js";

/* eslint-disable  @typescript-eslint/no-explicit-any */
(window as any).checkHDR = checkHDR;
(window as any).checkHDRCanvas = checkHDRCanvas;
(window as any).initHDRCanvas = initHDRCanvas;
(window as any).defaultGetContextHDR = defaultGetContextHDR;
(window as any).resetGetContext = resetGetContext;

(window as any).HDRWebGPUBackend = HDRWebGPUBackend;
(window as any).HDRWebGPURenderer = HDRWebGPURenderer;
