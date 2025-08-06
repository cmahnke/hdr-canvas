export function getBrowserVersion(): number | null {
  const majorVersionStr = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
  if (majorVersionStr == null) {
    console.warn(`Unsupported / untested browser (${navigator.userAgent}) detected - using more modern defaults`);
  } else if (majorVersionStr.length >= 3) {
    return Number(majorVersionStr[2]);
  }
  return null;
}
