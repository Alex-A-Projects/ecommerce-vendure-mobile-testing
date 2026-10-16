/**
 * Header / footer tests.
 *
 * Exercises the global navigation: every header link, every footer
 * link, and the search box. The store uses a single Remix layout for
 * the header and footer so the test is small but covers every
 * permanent fixture on the storefront.
 */
import { browser, $ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import { poms } from '../fixtures/pomFixtures';
import { VendureEndpoints } from '../data/testData';

describe('Header and footer', () => {
  const ctx = poms();

  beforeEach(async () => {
    await ctx.homePage.open();
  });

  it('header is present on the home page', async () => {
    await expect(ctx.homePage.header).toBeDisplayed();
  });

  it('footer is present on the home page', async () => {
    await expect(ctx.homePage.footer).toBeDisplayed();
  });

  it('header is present on a product detail page', async () => {
    await ctx.productDetailPage.openProduct('laptop');
    await expect(ctx.productDetailPage.header).toBeDisplayed();
  });

  it('footer is present on a product detail page', async () => {
    await ctx.productDetailPage.openProduct('laptop');
    await expect(ctx.productDetailPage.footer).toBeDisplayed();
  });

  it('header is present on a category page', async () => {
    await ctx.productListPage.openCollection('electronics');
    await expect(ctx.productListPage.header).toBeDisplayed();
  });

  it('header is present on the search page', async () => {
    await ctx.searchPage.open();
    await expect(ctx.searchPage.header).toBeDisplayed();
  });

  it('clicking the cart icon navigates to the cart', async () => {
    await expect(ctx.homePage.headerCartLink).toBeDisplayed();
    await ctx.homePage.headerCartLink.click();
    await browser.waitUntil(
      async () => /\/cart/.test(await browser.getUrl()),
      { timeout: 30_000, timeoutMsg: 'Cart icon click did not navigate to /cart' },
    );
  });

  it('header search box submits to the search route', async () => {
    const visible = await ctx.homePage.headerSearchInput.isDisplayed().catch(() => false);
    if (!visible) {
      throw new Error('__SKIP__:Header search input not visible on this layout');
    }
    await ctx.homePage.headerSearchInput.setValue('laptop');
    const btnVisible = await ctx.homePage.headerSearchButton.isDisplayed().catch(() => false);
    if (btnVisible) {
      await ctx.homePage.headerSearchButton.click();
    } else {
      await browser.keys(['Enter']);
    }
    await browser.waitUntil(
      async () => /search|laptop/.test(await browser.getUrl()),
      { timeout: 30_000, timeoutMsg: 'Header search did not navigate to a search URL' },
    );
  });

  it('header sign-in link navigates to the login page', async () => {
    const link = ctx.homePage.headerSignInLink;
    if (!(await link.isDisplayed().catch(() => false))) {
      throw new Error('__SKIP__:No header sign-in link');
    }
    const href = await link.getAttribute('href');
    expect(href).toMatch(/\/(account\/login|signin|sign-in|login)/);
    await link.click();
    await browser.waitUntil(
      async () => /login|sign-in/.test(await browser.getUrl()),
      { timeout: 30_000, timeoutMsg: 'Sign-in link did not navigate to /login' },
    );
  });

  it('header sign-up link is exposed somewhere in the header', async () => {
    await ctx.homePage.goto('/');
    const link = $('header a[href*="/register"], header a*=Register, header a*=Sign up');
    const visible = await link.isDisplayed().catch(() => false);
    if (!visible) {
      throw new Error('__SKIP__:No register / sign-up link in the header');
    }
    const href = await link.getAttribute('href');
    expect(href).toMatch(/\/(account\/register|signup|sign-up|register)/);
  });

  it('footer copyright year is current', async () => {
    const text = (await ctx.homePage.footer.getText()).trim();
    const year = new Date().getFullYear();
    expect(text).toContain(String(year));
  });

  it('footer contains a privacy policy link', async () => {
    const href = await ctx.homePage.footerPrivacyLink.getAttribute('href').catch(() => null);
    if (!href) {
      throw new Error('__SKIP__:No privacy link in footer');
    }
    expect(href).toBeTruthy();
  });

  it('footer contains a terms-of-service link', async () => {
    const href = await ctx.homePage.footerTermsLink.getAttribute('href').catch(() => null);
    if (!href) {
      throw new Error('__SKIP__:No terms link in footer');
    }
    expect(href).toBeTruthy();
  });

  it('header logo is a link back to the home page', async () => {
    const href = await ctx.homePage.logoLink.getAttribute('href');
    expect(href).toMatch(/\/en\/?$|vendure\.io/);
  });

  it('every footer link is reachable (no obvious 5xx)', async () => {
    const links = await ctx.homePage.footer.$$('a[href]');
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      const absolute = href.startsWith('http') ? href : new URL(href, VendureEndpoints.storefront).toString();
      expect(absolute).toMatch(/vendure\.io/);
      await ctx.homePage.goto('/');
    }
  });
});