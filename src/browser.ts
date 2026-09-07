/**
 * Detects Safari based on the user agent string.
 * This is used to work around Safari's different HDR canvas support.
 *
 * @returns {boolean} `true` if the browser is Safari.
 */
export function isSafari(): boolean {
  return Array.isArray(navigator.userAgent.match(/Version\/[\d.]+.*Safari/));
}
