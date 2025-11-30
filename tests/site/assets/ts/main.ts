import { checkHDR, checkHDRVideo, checkHDRCanvas } from "~/hdr-canvas/hdr-check";
import { initModel } from "./hdr-three.js";
import { initCanvas } from "./image-slider.js";

document.addEventListener("DOMContentLoaded", function () {
  const hdrCheck = document.getElementById("hdr-check")! as HTMLDivElement;
  const hdrVideoCheck = document.getElementById("hdr-video-check")! as HTMLDivElement;
  const hdrCanvasCheck = document.getElementById("hdr-canvas-check")! as HTMLDivElement;

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
