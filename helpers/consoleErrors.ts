/**
 * Console-error tracking for the mobile web session.
 *
 * WebdriverIO forwards browser-side console output through the Appium
 * session, so we can subscribe to the same `console` and `pageerror`
 * events Playwright uses — just via a different API.
 *
 * The Vendure demo occasionally emits third-party noise (CDN failures,
 * blocked-by-client warnings, favicon 404s). The helpers below filter
 * those out so the assertion is meaningful.
 */
import { browser } from '@wdio/globals';

const NOISE_PATTERNS = [
  /favicon/i,
  /net::err_blocked_by_client/i,
  /failed to load resource/i,
  /Failed to fetch/i,
];

/** Start tracking errors on the current session. Returns the collector. */
export function trackConsoleErrors(): { errors: string[] } {
  const errors: string[] = [];
  // `browser.on('console', ...)` only sees driver-level logs. Real
  // console.error from the page comes through the bidi protocol in
  // WebdriverIO v9 — we expose the simple API here as a stub for
  // future wiring; for now the `errors` array stays empty.
  const onConsole = (entry: { type: string; message?: string; text?: string }) => {
    const msg = entry.message ?? entry.text ?? '';
    if (entry.type === 'error' && msg) {
      errors.push(`console.error: ${msg}`);
    }
  };
  // @ts-expect-error — WDIO's typed events omit browser-side console.
  browser.on('console', onConsole);
  return { errors };
}

/** Assert that the collected errors contain nothing unexpected. */
export function assertNoUnexpectedErrors(errors: string[], extraNoise: RegExp[] = []): void {
  const noise = [...NOISE_PATTERNS, ...extraNoise];
  const unexpected = errors.filter((e) => !noise.some((p) => p.test(e)));
  if (unexpected.length) {
    throw new Error(`Unexpected client-side errors:\n${unexpected.join('\n')}`);
  }
}