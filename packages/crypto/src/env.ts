/**
 * Runtime environment detection.
 * Determines whether we're running in Node.js or browser.
 */
export const isNode =
  typeof process !== 'undefined' &&
  process.versions != null &&
  process.versions.node != null

export const isBrowser = !isNode
