import { checkHDR, checkHDRVideo, checkHDRCanvas, checkFloat16Array, checkHDRBitDepth } from "~/hdr-canvas/hdr-check";
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
  const hdrVideoCheck = document.getElementById("hdr-video-check")! as HTMLDivElement;
  const hdrCanvasCheck = document.getElementById("hdr-canvas-check")! as HTMLDivElement;
  const float16arrayCheck = document.getElementById("float16array-check")! as HTMLDivElement;
  const screenCheck = document.getElementById("screen-check")! as HTMLDivElement;

  setInterval(() => {
    setStatus(hdrCheck, checkHDR());
    setStatus(hdrVideoCheck, checkHDRVideo());
    setStatus(hdrCanvasCheck, checkHDRCanvas());
    setStatus(float16arrayCheck, checkFloat16Array());
    setStatus(screenCheck, checkHDRBitDepth());
  }, 500);

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
