import semver from "semver";
import { readPackageJSON } from "pkg-types";

export async function setup(): Promise<void> {
  const localPackageJson = await readPackageJSON();
  const version = localPackageJson.engines.node;
  if (!semver.satisfies(process.version, version)) {
    console.log(`Required node version ${version} not satisfied with current version ${process.version}.`);
    process.exit(1);
  }
}

export default setup;
