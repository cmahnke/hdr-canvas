import { Uint16Image, checkHDR, checkHDRCanvas, initHDRCanvas, defaultGetContextHDR, resetGetContext } from "hdr-canvas";
import HDRWebGPUBackend from "hdr-canvas/three/HDRWebGPUBackend.js";
import HDRWebGPURenderer from "hdr-canvas/three/HDRWebGPURenderer.js";

window.checkHDR = checkHDR;
window.checkHDRCanvas = checkHDRCanvas;
window.initHDRCanvas = initHDRCanvas;
window.defaultGetContextHDR = defaultGetContextHDR;
window.resetGetContext = resetGetContext;

window.HDRWebGPUBackend = HDRWebGPUBackend;
window.HDRWebGPURenderer = HDRWebGPURenderer;
