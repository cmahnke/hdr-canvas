import { checkHDRCanvas } from "~/hdr-canvas/hdr-check";
import { initHDRCanvas } from "~/hdr-canvas/hdr-canvas";
import { Float16Image } from "~/hdr-canvas/Float16Image";
import type { HDRHTMLCanvasElement } from "~/hdr-canvas/types/HDRCanvas.d.ts";

const colors: Record<string, number> = { red: 0, green: 0, blue: 0 };
let rec210hglImage: Float16Image;
let hdrCtx: CanvasRenderingContext2D | null;

function setupCanvas(canvas: HTMLCanvasElement, width?: number, height?: number): CanvasRenderingContext2D | null {
  if (width !== undefined && width !== 0) {
    canvas.width = width;
  }
  if (height !== undefined && height !== 0) {
    canvas.height = height;
  }

  let ctx: CanvasRenderingContext2D | null;
  if (checkHDRCanvas()) {
    ctx = initHDRCanvas(canvas as HDRHTMLCanvasElement);
    if (ctx !== null) {
      (ctx as CanvasRenderingContext2D).imageSmoothingEnabled = false;
    }
  } else {
    console.log("Canvas ist't HDR enabled");
    ctx = canvas.getContext("2d")!;
  }
  return ctx;
}

export function initCanvas(canvas: HTMLCanvasElement, imageUrl: URL) {
  if (!checkHDRCanvas()) {
    Float16Image.loadSDRImageData(imageUrl).then((imageData) => {
      if (imageData !== undefined) {
        const ctx = setupCanvas(canvas, imageData.width, imageData.height) as CanvasRenderingContext2D;
        ctx.putImageData(imageData, 0, 0);
        ctx.font = "bold 36px sans-serif";
        ctx.fillStyle = "#ff0000";
        ctx.fillText("HDR not supported!", 90, 100);
        ctx.fillText("Image manipulation disabled", 10, 150);
      }
    });
    return;
  }

  Float16Image.loadSDRImageData(imageUrl).then((imageData) => {
    if (imageData !== undefined) {
      hdrCtx = setupCanvas(canvas, imageData.width, imageData.height);
      if (hdrCtx !== null) {
        rec210hglImage = Float16Image.fromImageData(imageData);
        console.log(rec210hglImage);
        if (rec210hglImage !== null) {
          const data = rec210hglImage.getImageData();
          if (data !== null) {
            hdrCtx.putImageData(data, 0, 0);
          }
        }
      }
    }
  });

  const sliders: Record<string, HTMLInputElement> = {};
  ["red", "green", "blue"].forEach((channel) => {
    const slider = document.getElementById(`${channel}Slider`) as HTMLInputElement;
    if (slider) {
      sliders[channel] = slider;
      const labelSpan = document.querySelector<HTMLElement>(`label[for=${slider.id}] span`);
      if (labelSpan) {
        labelSpan.innerText = `${slider.value}%`;
      }
      colors[channel] = Number(slider.value);
      slider.oninput = function () {
        const value = (this as HTMLInputElement).value;
        const label = document.querySelector<HTMLElement>(`label[for=${(this as HTMLInputElement).id}] span`);
        if (label) {
          label.innerText = `${value}%`;
        }
        colors[channel] = Number(value);
        if (rec210hglImage && hdrCtx) {
          const changedImage = rec210hglImage.clone();
          changedImage.pixelCallback((r, g, b, a) => {
            const nr = (r / 50) * colors["red"];
            const ng = (g / 50) * colors["green"];
            const nb = (b / 50) * colors["blue"];
            return Float16Array.from([nr, ng, nb, a]);
          });
          const data = changedImage.getImageData();
          if (data !== null) {
            hdrCtx.putImageData(data, 0, 0);
          }
        }
      };
    }
  });
}
