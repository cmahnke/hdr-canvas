import {
  checkHDR,
  checkWCG,
  checkDynamicRangeHigh,
  checkHDRVideo,
  checkHDRCanvas,
  checkWCGCanvas,
  checkFloat16Array,
  checkHDRBitDepth,
  onDisplayChange
} from "~/hdr-canvas/hdr-check";
import { initModel } from "./hdr-three.js";
import { initCanvas } from "./image-slider.js";

function setStatus(element: HTMLDivElement, status: boolean) {
  if (status) {
    element.classList.add("success");
    element.classList.remove("fail");
  } else {
    element.classList.add("fail");
    element.classList.remove("success");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const hdrCheck = document.getElementById("hdr-check")! as HTMLDivElement;
  const wcgCheck = document.getElementById("wcg-check")! as HTMLDivElement;
  const dynamicRangeCheck = document.getElementById("dynamic-range-check")! as HTMLDivElement;
  const hdrVideoCheck = document.getElementById("hdr-video-check")! as HTMLDivElement;
  const hdrCanvasCheck = document.getElementById("hdr-canvas-check")! as HTMLDivElement;
  const wcgCanvasCheck = document.getElementById("wcg-canvas-check")! as HTMLDivElement;
  const float16arrayCheck = document.getElementById("float16array-check")! as HTMLDivElement;
  const screenCheck = document.getElementById("screen-check")! as HTMLDivElement;

  function updateStatuses(): void {
    setStatus(hdrCheck, checkHDR());
    setStatus(wcgCheck, checkWCG());
    setStatus(dynamicRangeCheck, checkDynamicRangeHigh());
    setStatus(hdrVideoCheck, checkHDRVideo());
    setStatus(hdrCanvasCheck, checkHDRCanvas());
    setStatus(wcgCanvasCheck, checkWCGCanvas());
    setStatus(float16arrayCheck, checkFloat16Array());
    setStatus(screenCheck, checkHDRBitDepth());
  }

  setInterval(updateStatuses, 500);
  // Re-check when the window moves between screens (e.g. HDR internal display
  // and SDR external screen), see https://github.com/cmahnke/hdr-canvas/issues/107.
  onDisplayChange(updateStatuses, { pollIntervalMs: 2000 });

  try {
    const modelUrl = "glb/uranium.glb";
    const canvas = document.getElementById("canvas-renderer")! as HTMLCanvasElement;
    initModel(canvas, modelUrl);
  } catch {
    console.error("Failed to load model");
  }

  const imageUrl = "images/sample.jpeg";
  const sliderCanvas = document.querySelector<HTMLCanvasElement>("#slider-canvas");

  initCanvas(sliderCanvas!, new URL(imageUrl, window.location.href));
});
