/**
 * Element helpers — small wrappers around WebdriverIO's built-in waits
 * that make specs more readable.
 */

import { browser, $ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';

/**
 * Wait for the URL to contain a substring (regex-escaped).
 *
 * Useful when a redirect is asynchronous but the spec needs to assert
 * the final URL.
 */
export async function waitForUrl(fragment: string, timeout = 15_000): Promise<void> {
  await browser.waitUntil(
    async () => new RegExp(fragment).test(await browser.getUrl()),
    { timeout, timeoutMsg: `URL did not contain ${fragment} within ${timeout}ms` },
  );
}

/** Conditionally skip the current test if a check returns false. */
export function skipIf(condition: boolean, reason: string): void {
  if (condition) {
    // Mocha's pending test signal.
    throw new Error(`__SKIP__:${reason}`);
  }
}

/** Return a sensible Allure severity for the current test (default = normal). */
export function severity(s: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial') {
  return s;
}

/** Re-export the standard WebdriverIO `expect` for convenience. */
export { expect };

/** Re-export `browser` and `$` so specs only import from `@helpers/wait`. */
export { browser, $ };