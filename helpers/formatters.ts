/**
 * Generic helpers shared across the mobile-web test suite.
 *
 * - Price parsing/formatting in USD.
 * - Unique email generation for registration tests.
 * - Trivial promise sleep (used sparingly — prefer WebdriverIO waits).
 */

/** Format a number as USD currency string (no fractional cents). */
export function formatUSD(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Strip currency symbols and parse to a number. */
export function parsePrice(text: string): number {
  return Number(text.replace(/[^0-9.]/g, ''));
}

/** Generate a unique email for account-registration tests. */
export function uniqueEmail(prefix = 'qa'): string {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1_000_000);
  return `${prefix}-${ts}-${rand}@example.com`;
}

/** Sleep helper — used sparingly to give the storefront a beat to settle. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}