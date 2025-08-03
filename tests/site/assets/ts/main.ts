import { checkHDR, checkHDRCanvas } from "~/hdr-canvas";

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
});
