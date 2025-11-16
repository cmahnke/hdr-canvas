import { expect, test } from "vitest";
import fileUrl from "file-url";
import * as fs from "fs/promises";

import { JSDOM } from "jsdom";

import { Float16Image } from "~/hdr-canvas/Float16Image";

import { createCanvas, Image, loadImage } from "@napi-rs/canvas";
import * as THREE from "three";
import { UltraHDRLoader } from "three/examples/jsm/loaders/UltraHDRLoader.js";

import semver from "semver";
import { readPackageJSON } from "pkg-types";

const testHDRImage = "./tests/site/public/images/red-ultrahdr.jpeg";
const testSDRImage = "./tests/site/public/images/sample.jpeg";
const localPackageJson = await readPackageJSON();

if (typeof DOMParser === "undefined") {
  const jsdom = new JSDOM();
  global.DOMParser = jsdom.window.DOMParser;
}

/**
 *
 * @param filePath
 * @returns this currently throws an exception, see https://github.com/mrdoob/three.js/issues/32293
 */
async function loadThreeJS(filePath: string): Promise<Float16Image> {
  const buffer = await fs.readFile(filePath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length);

  return new Promise((resolve, reject) => {
    const loader = new UltraHDRLoader();
    loader.setDataType(THREE.HalfFloatType);
    try {
      loader.parse(arrayBuffer as ArrayBuffer, (texture) => {
        function convertToHalfFloat(array: Uint16Array | Float32Array): Float16Array {
          let float32SourceArray: Float32Array;

          if (array instanceof Float32Array) {
            float32SourceArray = array;
          } else if (array instanceof Uint16Array) {
            float32SourceArray = new Float32Array(array.length);
            for (let i = 0; i < array.length; i++) {
              float32SourceArray[i] = array[i];
            }
          } else {
            throw new Error("Input array must be a Uint16Array or a Float32Array.");
          }

          const halfFloatArray = new Float16Array(float32SourceArray.length);

          for (let i = 0; i < float32SourceArray.length; i++) {
            halfFloatArray[i] = THREE.DataUtils.toHalfFloat(float32SourceArray[i]);
          }

          return halfFloatArray;
        }

        const imageData = convertToHalfFloat(texture.hdrBuffer);

        const f16i = new Float16Image(texture.width, texture.height);
        f16i.data = imageData as Float16Array;
        resolve(f16i);
      });
    } catch (error) {
      console.error(
        "The ThreeJS UltraHDRLoader currently can't handle ISO 21496-1 gain maps, see https://github.com/mrdoob/three.js/issues/32293"
      );
      reject(error);
    }
  });
}

const version = localPackageJson.engines.node;
if (!semver.satisfies(process.version, version)) {
  console.log(`Required node version ${version} not satisfied with current version ${process.version}.`);
  process.exit(1);
}

function getAsImageData(image: Image, w: number, h: number): ImageData {
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h) as ImageData;
  return imageData;
}

async function loadSDRImageAsImageData(file: string): Promise<Uint8ClampedArray> {
  const image = await loadImage(file);

  const { width, height } = image;
  const data: ImageData = getAsImageData(image, width, height);

  console.log(`Loaded image file with ${width}x${height}, color space: ${data.colorSpace}`);
  return data.data;
}

test("loadThreeJS", async () => {
  expect(testHDRImage).toBeDefined();
  console.log(`Using test file from ${testHDRImage}`);
  await expect(loadThreeJS(testHDRImage)).rejects.toThrowError();
});

test("load", async () => {
  const url = new URL(fileUrl(testHDRImage));
  expect(url).toBeDefined();
  console.log(`Using test file from ${url}`);

  const image = await loadImage(testHDRImage);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageDataFromCanvas = ctx.getImageData(0, 0, image.width, image.height);
  const f16image = Float16Image.fromImageDataArray(image.width, image.height, imageDataFromCanvas.data);
  expect(f16image).toBeDefined();
  expect(f16image).toBeInstanceOf(Float16Image);
});

test("loadSDR", async () => {
  const data = await loadSDRImageAsImageData(testSDRImage);
  expect(data).toBeDefined();
});
