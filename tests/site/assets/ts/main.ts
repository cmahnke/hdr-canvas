import { checkHDR, checkHDRCanvas } from "~/hdr-canvas/hdr-check";
import { initModel } from "./hdr-three.js";
import { initCanvas } from "./image-slider.js";

document.addEventListener("DOMContentLoaded", function () {
  const hdrCheck = document.getElementById("hdr-check")! as HTMLDivElement;
  const hdrCanvasCheck = document.getElementById("hdr-canvas-check")! as HTMLDivElement;

  if (checkHDR()) {
    hdrCheck.classList.add("success");
  } else {
    hdrCheck.classList.add("fail");
  }

  if (checkHDRCanvas()) {
    hdrCanvasCheck.classList.add("success");
  } else {
    hdrCanvasCheck.classList.add("fail");
  }

  const modelUrl = "glb/uranium.glb";
  const canvas = document.getElementById("canvas-renderer")! as HTMLCanvasElement;
  initModel(canvas, modelUrl);

  const imageUrl = "images/sample.jpeg";
  const sliderCanvas = document.querySelector("#slider-canvas");

  initCanvas(sliderCanvas, imageUrl);
});
