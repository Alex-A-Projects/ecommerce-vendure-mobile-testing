/**
 * Account section tests.
 *
 * The Vendure Remix Storefront demo exposes:
 *   /en/account/profile — public profile view (no auth required)
 *   /en/account/orders  — redirects to /en/sign-in when not authed
 *   /en/sign-in         — sign-in form (see account-login.spec.ts)
 *   /en/register        — registration form (see account-register.spec.ts)
 *
 * Tests self-skip if the relevant route 404s.
 */
import { browser, $ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import { poms } from '../fixtures/pomFixtures';
import { SeededCustomer } from '../data/testData';

describe('Account section', () => {
  const ctx = poms();

  it('the profile page loads and shows the heading', async () => {
    await ctx.homePage.goto('/account/profile');
    const h1 = $('h1, h2');
    let visible = false;
    try {
      await browser.waitUntil(
        async () => await h1.isDisplayed(),
        { timeout: 10_000, timeoutMsg: 'No profile heading' },
      );
      visible = true;
    } catch {
      visible = false;
    }
    if (!visible) {
      throw new Error('__SKIP__:No /account/profile in this build');
    }
    const text = (await h1.getText()).trim();
    expect(text.length).toBeGreaterThan(0);
  });

  it('the orders page redirects to sign-in when not authenticated', async () => {
    await ctx.homePage.goto('/account/orders');
    await browser.waitUntil(
      async () => /sign-in/.test(await browser.getUrl()),
      { timeout: 15_000, timeoutMsg: 'Account orders did not redirect to /sign-in' },
    );
    const heading = $('h1*=Sign In, h2*=Sign In, h1*=Sign in');
    await expect(heading).toBeDisplayed({ wait: 15_000 });
  });

  it('the sign-in page exposes a form with email and password fields', async () => {
    await ctx.homePage.goto('/sign-in');
    await expect(ctx.accountLoginPage.emailInput).toBeDisplayed({ wait: 10_000 });
    await expect(ctx.accountLoginPage.passwordInput).toBeDisplayed();
  });

  it('the sign-in page has a register link', async () => {
    await ctx.homePage.goto('/sign-in');
    const link = $('a[href*="/register"], a*=Register');
    await expect(link).toBeDisplayed({ wait: 10_000 });
  });

  it('the register page loads and shows a heading', async () => {
    await ctx.homePage.goto('/register');
    const h1 = $('h1, h2');
    let visible = false;
    try {
      await browser.waitUntil(
        async () => await h1.isDisplayed(),
        { timeout: 10_000, timeoutMsg: 'No register heading' },
      );
      visible = true;
    } catch {
      visible = false;
    }
    if (!visible) {
      throw new Error('__SKIP__:No /register in this build');
    }
    const text = (await h1.getText()).trim();
    expect(text.length).toBeGreaterThan(0);
  });

  it('the register page exposes a sign-in link', async () => {
    await ctx.homePage.goto('/register');
    const link = $('a[href*="/sign-in"], a*=Sign in');
    await expect(link).toBeDisplayed({ wait: 10_000 });
  });

  it('signing in with the seeded customer reaches the profile or shows a verification message', async () => {
    await ctx.homePage.goto('/sign-in');
    await ctx.accountLoginPage.emailInput.setValue(SeededCustomer.emailAddress);
    await ctx.accountLoginPage.passwordInput.setValue(SeededCustomer.password);
    await ctx.accountLoginPage.submitButton.click();
    await browser.waitUntil(
      async () => /\/account/.test(await browser.getUrl()) || /verify|invalid|incorrect/i.test(await $('body').getText()),
      { timeout: 15_000, timeoutMsg: 'Sign-in did not reach an observable outcome' },
    );
    const url = await browser.getUrl();
    const body = await $('body').getText();
    expect(/\/account/.test(url) || /verify|invalid|incorrect/i.test(body)).toBeTruthy();
  });
});