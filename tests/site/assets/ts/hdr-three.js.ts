import * as THREE from "three/src/Three.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import HDRWebGPURenderer from "~/hdr-canvas/three/HDRWebGPURenderer.js";
import WebGPU from "~/hdr-canvas/three/WebGPU.js";
import { checkHDRCanvas } from "~/hdr-canvas";

let scene: THREE.Scene,
  renderer: HDRWebGPURenderer | THREE.WebGLRenderer,
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
      model.traverse((element) => {
        if (element instanceof THREE.Mesh && element?.material?.type != undefined) {
          const targetMaterial = new THREE.MeshBasicMaterial();
          THREE.MeshBasicMaterial.prototype.copy.call(targetMaterial, element.material);
          element.material = targetMaterial;
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
  if (WebGPU.isAvailable() && checkHDRCanvas()) {
    renderer = new HDRWebGPURenderer({ canvas: canvas, antialias: true });
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
