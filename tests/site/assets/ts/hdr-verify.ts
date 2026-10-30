import * as THREE from "three/src/Three.js";
import HDRWebGPURenderer from "~/hdr-canvas/three/HDRWebGPURenderer.js";
import WebGPURenderer from "three/src/renderers/webgpu/WebGPURenderer.js";
import { TextureLoader } from "three/src/loaders/TextureLoader.js";
import { checkHDRCanvas } from "~/hdr-canvas/hdr-check";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  PATCH_RECT,
  PATCH_VALUES,
  TEXTURE_RECT,
  evaluateVerdict,
  getMeasureRects,
  measureRects,
  type VerifyVerdict
} from "./hdr-verify-lib.js";

declare global {
  interface Window {
    __hdrVerify: VerifyVerdict;
  }
}

// GPU constants (duplicated numerically to avoid dependency on WebGPU typings)
const GPU_MAP_READ = 0x0001;
const GPU_COPY_DST = 0x0008;

const textureUrl = "images/hdr-steps-ultrahdr.jpeg";

let renderer: HDRWebGPURenderer | WebGPURenderer;
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let verdict: VerifyVerdict = {
  done: false,
  hdrCanvas: false,
  dynamicRangeHigh: false,
  canvasFormat: null,
  canvasColorSpace: null,
  toneMappingMode: null,
  renderer: "unknown",
  measured: {},
  textureHDR: false,
  pass: false
};

const verdictElement = document.getElementById("verdict") as HTMLPreElement;

function updateVerdict() {
  (window as unknown as { __hdrVerify?: VerifyVerdict }).__hdrVerify = verdict;
  if (verdictElement) {
    verdictElement.textContent = JSON.stringify(verdict, null, 2);
  }
  if (verdict.done) {
    document.title = `${document.title} - ${verdict.pass ? "PASS" : "FAIL"}`;
  }
}

function buildScene() {
  scene = new THREE.Scene();
  // Orthographic camera matching the canvas pixel layout (500 px per world unit)
  camera = new THREE.OrthographicCamera(0, 1.6, 0.9, 0, -10, 10);

  // Raw value patches: MeshBasicMaterial with linear scene values > 1.0
  const patchGeometry = new THREE.PlaneGeometry(PATCH_RECT.width / 500, PATCH_RECT.height / 500);
  const patchCount = PATCH_VALUES.length;
  const patchStride = PATCH_RECT.width + PATCH_RECT.gap;
  const totalWidth = patchCount * PATCH_RECT.width + (patchCount - 1) * PATCH_RECT.gap;
  const offsetX = (CANVAS_WIDTH - totalWidth) / 2;
  for (let i = 0; i < patchCount; i++) {
    const material = new THREE.MeshBasicMaterial();
    material.color.setRGB(PATCH_VALUES[i], PATCH_VALUES[i], PATCH_VALUES[i]);
    const mesh = new THREE.Mesh(patchGeometry, material);
    const x = offsetX + i * patchStride + PATCH_RECT.width / 2;
    const y = PATCH_RECT.offsetY + PATCH_RECT.height / 2;
    mesh.position.set(x / 500, (CANVAS_HEIGHT - y) / 500, 0);
    scene.add(mesh);
  }
}

async function loadTexture() {
  const loader = new TextureLoader();
  const texture = await loader.loadAsync(textureUrl);
  // Canvas format must be float16 for values above 1.0 to survive
  texture.type = THREE.HalfFloatType;
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  const geometry = new THREE.PlaneGeometry(CANVAS_WIDTH / 500, TEXTURE_RECT.height / 500);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const canvasY = TEXTURE_RECT.offsetY + TEXTURE_RECT.height / 2;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(CANVAS_WIDTH / 2 / 500, (CANVAS_HEIGHT - canvasY) / 500, 0);
  scene.add(mesh);
}

async function performReadback() {
  const canvas = renderer.domElement as HTMLCanvasElement;
  const context = canvas.getContext("webgpu") as GPUCanvasContext | null;
  if (!context) {
    verdict.error = "getContext('webgpu') returned null";
    verdict.done = true;
    updateVerdict();
    return;
  }
  const configuration = context.getConfiguration() as {
    format?: string;
    colorSpace?: string;
    toneMapping?: { mode?: string };
  } | null;
  const source = context.getCurrentTexture();
  const width = source.width;
  const height = source.height;
  const format = configuration?.format ?? source.format;
  const bytesPerPixel = format.includes("16float") ? 8 : 4;
  const bytesPerRow = Math.ceil((width * bytesPerPixel) / 256) * 256;
  const device = (
    renderer as unknown as {
      backend: {
        device?: {
          createBuffer: (d: unknown) => {
            mapAsync: (m: number) => Promise<void>;
            getMappedRange: () => ArrayBuffer;
            unmap: () => void;
            destroy: () => void;
          };
        };
      };
    }
  ).backend.device as {
    createBuffer: (descriptor: unknown) => {
      mapAsync: (mode: number) => Promise<void>;
      getMappedRange: () => ArrayBuffer;
      unmap: () => void;
      destroy: () => void;
    };
    createCommandEncoder: () => {
      copyTextureToBuffer: (a: unknown, b: unknown, c: unknown) => void;
      finish: () => unknown;
    };
    queue: { submit: (commands: unknown) => void };
  };
  if (!device) {
    verdict.error = "Backend has no GPUDevice (WebGL fallback?)";
    verdict.done = true;
    updateVerdict();
    return;
  }
  const buffer = device.createBuffer({
    size: bytesPerRow * height,
    usage: GPU_COPY_DST | GPU_MAP_READ
  });
  const encoder = device.createCommandEncoder();
  encoder.copyTextureToBuffer({ texture: source }, { buffer, bytesPerRow, rowsPerImage: height }, { width, height, depthOrArrayLayers: 1 });
  device.queue.submit([encoder.finish()]);
  await buffer.mapAsync(GPU_MAP_READ);
  const data = buffer.getMappedRange();
  const measured = measureRects(data, width, height, getMeasureRects(), bytesPerPixel);
  buffer.unmap();
  buffer.destroy();
  verdict.canvasFormat = format;
  verdict.canvasColorSpace = configuration?.colorSpace ?? null;
  verdict.toneMappingMode = configuration?.toneMapping?.mode ?? null;
  verdict.dynamicRangeHigh = window.matchMedia("(dynamic-range: high)").matches;
  verdict.hdrCanvas = checkHDRCanvas();
  const evaluated = evaluateVerdict(measured, verdict);
  evaluated.renderer = verdict.renderer;
  verdict = evaluated;
  updateVerdict();
}

async function run() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("renderer") === "stock" ? "stock" : "hdr";
  verdict.renderer = mode;
  const canvas = document.getElementById("verify-canvas") as HTMLCanvasElement;
  const stockLink = document.getElementById("stock-link") as HTMLAnchorElement;
  stockLink.href = mode === "hdr" ? "./hdr-verify.html?renderer=stock" : "./hdr-verify.html";
  stockLink.textContent =
    mode === "hdr" ? "Run with the stock WebGPURenderer (srgb + extended)" : "Run with the rec2100-hlg backend (HDRWebGPURenderer)";
  try {
    if (mode === "hdr") {
      renderer = new HDRWebGPURenderer({ canvas, antialias: true, outputType: THREE.HalfFloatType });
    } else {
      renderer = new WebGPURenderer({ canvas, antialias: true, outputType: THREE.HalfFloatType });
    }
    renderer.setPixelRatio(1);
    renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    // Linear output color space: material values pass through without encoding
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    await renderer.init();
    buildScene();
    await loadTexture();
    updateVerdict();
    let frame = 0;
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
      if (frame === 0) {
        performReadback().finally(() => {
          renderer.setAnimationLoop(null);
        });
      }
      frame++;
    });
  } catch (error) {
    verdict.done = true;
    verdict.error = String(error);
    updateVerdict();
  }
}

run();
