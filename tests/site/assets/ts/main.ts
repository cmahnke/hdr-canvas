import { checkHDR, checkHDRVideo, checkHDRCanvas, checkFloat16Array, checkHDRBitDepth } from "~/hdr-canvas/hdr-check";
import { initModel } from "./hdr-three.js";
import { initCanvas } from "./image-slider.js";

document.addEventListener("DOMContentLoaded", function () {
  const hdrCheck = document.getElementById("hdr-check")! as HTMLDivElement;
  const hdrVideoCheck = document.getElementById("hdr-video-check")! as HTMLDivElement;
  const hdrCanvasCheck = document.getElementById("hdr-canvas-check")! as HTMLDivElement;
  const float16arrayCheck = document.getElementById("float16array-check")! as HTMLDivElement;
  const screenCheck = document.getElementById("screen-check")! as HTMLDivElement;

  if (checkHDR()) {
    hdrCheck.classList.add("success");
  } else {
    hdrCheck.classList.add("fail");
  }

  if (checkHDRVideo()) {
    hdrVideoCheck.classList.add("success");
  } else {
    hdrVideoCheck.classList.add("fail");
  }

  if (checkHDRCanvas()) {
    hdrCanvasCheck.classList.add("success");
  } else {
    hdrCanvasCheck.classList.add("fail");
  }

  if (checkFloat16Array()) {
    float16arrayCheck.classList.add("success");
  } else {
    float16arrayCheck.classList.add("fail");
  }

  setInterval(() => {
    if (checkHDRBitDepth()) {
      screenCheck.classList.add("success");
    } else {
      screenCheck.classList.add("fail");
    }
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
