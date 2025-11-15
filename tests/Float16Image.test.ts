import { expect, test } from "vitest";
import fileUrl from "file-url";

import { Float16Image } from "~/hdr-canvas/Float16Image";

import { createCanvas, loadImage } from "@napi-rs/canvas";

const testImage = "tests/site/public/images/sample.jpeg";

import semver from "semver";
import { readPackageJSON } from "pkg-types";

const localPackageJson = await readPackageJSON();

const version = localPackageJson.engines.node;
if (!semver.satisfies(process.version, version)) {
  console.log(`Required node version ${version} not satisfied with current version ${process.version}.`);
  process.exit(1);
}

async function loadImageAsImageData(file: string): Promise<Uint8ClampedArray> {
  const image = await loadImage(file);

  const { width, height } = image;
  const rawBuffer = image.bitmap.data;

  return new Uint8ClampedArray(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.length);
}

test("load", async () => {
  let url = new URL(fileUrl(testImage));
  expect(url).toBeDefined();
  console.log(`Using test file from ${url}`);

  //const data = await loadImageAsImageData(testImage);
  const image = await loadImage(testImage);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageDataFromCanvas = ctx.getImageData(0, 0, image.width, image.height);
  let imageData = Float16Image.fromImageDataArray(image.width, image.height, imageDataFromCanvas.data);
  //expect(imageData).toBeDefined()
});
