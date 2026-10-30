import * as THREE from "three/src/Three.js";
import WebGPURenderer from "three/src/renderers/webgpu/WebGPURenderer.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import WebGPU from "~/hdr-canvas/three/WebGPU.js";
import { checkHDRCanvas } from "~/hdr-canvas/hdr-check";

let scene: THREE.Scene,
  renderer: WebGPURenderer | THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  model: THREE.Object3D;

export function initModel(canvas: HTMLCanvasElement, modelUrl: string) {
  if (canvas === null || canvas === undefined) {
    console.log("Model canvas is null!");
    return;
  }

  const loader = new GLTFLoader();
  scene = new THREE.Scene();

  loader.load(
    modelUrl,
    function (gltf) {
      model = gltf.scene;
      // Note: Don't use `instanceof` on the model here! The Vite dependency
      // optimization resolves `three/examples/jsm/...` imports (which use bare
      // `three` imports) to a different copy of the three classes than
      // `three/src/...` imports used here, so `instanceof` checks would fail.
      model.traverse((element) => {
        const object = element as THREE.Mesh;
        if (!object.isMesh || !object.material) {
          return;
        }
        const convert = (source: THREE.Material) => {
          const targetMaterial = new THREE.MeshBasicMaterial();
          // Basic materials are used for testing, no tone mapping is applied
          THREE.MeshBasicMaterial.prototype.copy.call(targetMaterial, source);
          return targetMaterial;
        };
        if (Array.isArray(object.material)) {
          object.material = object.material.map(convert);
        } else {
          object.material = convert(object.material);
        }
      });
      model.position.y = -1.0;
      scene.add(model);
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.log("An error happened", error);
    }
  );

  // Add alpha: true for transparency

  if (checkHDRCanvas() && WebGPU.isAvailable()) {
    // Stock three delivers an HDR canvas (float16 + extended tone mapping) via `outputType`
    renderer = new WebGPURenderer({ canvas: canvas, antialias: true, outputType: THREE.HalfFloatType });
  } else if (WebGPU.isAvailable()) {
    renderer = new WebGPURenderer({ canvas: canvas });
  } else {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  }
  const parentWidth = renderer.domElement.parentElement!.clientWidth;
  const parentHeight = renderer.domElement.parentElement!.clientHeight;

  camera = new THREE.PerspectiveCamera(40, parentWidth / parentHeight, 0.25, 20);

  camera.position.set(0, 6, 10);
  camera.lookAt(0, 0, 0);

  const ratio = window.devicePixelRatio || 1;
  renderer.setPixelRatio(ratio);

  renderer.setSize(parentWidth, parentHeight);
  renderer.setAnimationLoop(animate);
  renderer.setClearColor(0x000000, 0);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.05;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.maxDistance = 18;
  controls.minDistance = 4;

  window.addEventListener("resize", () => {
    camera.aspect = canvas.parentElement!.clientWidth / canvas.parentElement!.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.parentElement!.clientWidth, canvas.parentElement!.clientHeight);
  });
}

function animate() {
  setTimeout(function () {
    requestAnimationFrame(animate);
  }, 1000 / 30);

  controls.update();
  renderer.render(scene, camera);
}
