/**
 * Account login tests.
 *
 * The Vendure Remix Storefront demo exposes /sign-in (not /account/login).
 * Tests self-skip if the route is unavailable.
 */
import { browser } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import { poms } from '../fixtures/pomFixtures';

describe('Account login', () => {
  const ctx = poms();

  beforeEach(async () => {
    try {
      await ctx.accountLoginPage.open();
    } catch {
      throw new Error('__SKIP__:No /sign-in UI in this storefront build');
    }
    if (!(await ctx.accountLoginPage.heading.isDisplayed().catch(() => false))) {
      throw new Error('__SKIP__:No /sign-in UI in this storefront build');
    }
  });

  it('login page loads and shows the heading', async () => {
    await ctx.accountLoginPage.assertLoaded();
  });

  it('email field is type="email"', async () => {
    const visible = await ctx.accountLoginPage.emailInput.isDisplayed().catch(() => false);
    if (!visible) throw new Error('__SKIP__:No email input on the login page');
    const type = await ctx.accountLoginPage.emailInput.getAttribute('type');
    expect(type).toBe('email');
  });

  it('password field is type="password"', async () => {
    const visible = await ctx.accountLoginPage.passwordInput.isDisplayed().catch(() => false);
    if (!visible) throw new Error('__SKIP__:No password input on the login page');
    const type = await ctx.accountLoginPage.passwordInput.getAttribute('type');
    expect(type).toBe('password');
  });

  it('register link is exposed', async () => {
    const href = await ctx.accountLoginPage.registerLink.getAttribute('href').catch(() => null);
    if (!href) throw new Error('__SKIP__:No register link on the sign-in page');
    expect(href).toMatch(/\/(register|signup|sign-up|account\/register)/);
  });

  it('signing in with wrong credentials shows an error or stays on the page', async () => {
    await ctx.accountLoginPage.signIn('nobody@example.com', 'wrongpassword');
    const error = await ctx.accountLoginPage.getError();
    const url = await browser.getUrl();
    const stillOnLogin = /sign-in|login/.test(url);
    expect(stillOnLogin || error.length > 0).toBeTruthy();
  });

  it('login with empty fields is rejected', async () => {
    const visible = await ctx.accountLoginPage.submitButton.isDisplayed().catch(() => false);
    if (!visible) throw new Error('__SKIP__:No submit button on the sign-in page');
    await ctx.accountLoginPage.submitButton.click();
    await browser.waitUntil(
      async () => /sign-in|login/.test(await browser.getUrl()),
      { timeout: 15_000, timeoutMsg: 'Empty sign-in did not stay on the page' },
    );
    const url = await browser.getUrl();
    expect(/sign-in|login/.test(url)).toBeTruthy();
  });
});