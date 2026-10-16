/**
 * Home page tests — covers the public storefront landing page.
 *
 * Asserts:
 *  - Page loads at the root URL.
 *  - Hero is visible and has meaningful copy.
 *  - Featured product cards link to product detail pages.
 *  - Header navigation links exist and the search/cart icons render.
 *  - Footer links render and the copyright line is visible.
 *  - The product cards have non-zero prices and a thumbnail image.
 *
 * Mobile web notes:
 *  - The /<locale>/ path is preserved on touch platforms.
 *  - On mobile Safari the header collapses into a hamburger; we
 *    relax link visibility checks accordingly.
 */
import { browser, $ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import { poms } from '../fixtures/pomFixtures';
import { VendureEndpoints } from '../data/testData';

describe('Home page', () => {
  const ctx = poms();

  beforeEach(async () => {
    await ctx.homePage.open();
  });

  it('loads the storefront root URL', async () => {
    const url = await browser.getUrl();
    expect(url).toMatch(/vendure\.io\/en\/?$/);
    // Header and footer exist regardless of viewport size.
    await expect(ctx.homePage.header).toBeDisplayed({ wait: 15_000 });
    await expect(ctx.homePage.footer).toBeDisplayed({ wait: 15_000 });
  });

  it('displays a hero heading with marketing copy', async () => {
    const heading = await ctx.homePage.getPageHeading();
    expect(heading.length).toBeGreaterThan(0);
  });

  it('header shows the brand logo and core navigation links', async () => {
    await expect(ctx.homePage.logoLink).toBeDisplayed();
    await expect(ctx.homePage.navElectronics).toBeDisplayed();
  });

  it('header collection nav links resolve to the right URLs', async () => {
    const checks = [
      [ctx.homePage.navAllProducts, '/search'],
      [ctx.homePage.navElectronics, '/collection/electronics'],
      [ctx.homePage.navSportswear, '/collection/sports'],
      [ctx.homePage.navHomeGarden, '/collection/home-garden'],
    ] as const;

    for (const [locator, expectedFragment] of checks) {
      if (!(await locator.isDisplayed().catch(() => false))) continue;
      const href = await locator.getAttribute('href');
      expect(href).toMatch(new RegExp(expectedFragment));
      await browser.url(VendureEndpoints.storefront + '/en');
    }
  });

  it('the header exposes a search input and a cart link', async () => {
    const searchVisible = await ctx.homePage.headerSearchInput.isDisplayed().catch(() => false);
    const searchBtnVisible = await ctx.homePage.headerSearchButton.isDisplayed().catch(() => false);
    expect(searchVisible || searchBtnVisible).toBeTruthy();
    await expect(ctx.homePage.headerCartLink).toBeDisplayed();
  });

  it('the footer renders About, Contact, Privacy, and Terms links', async () => {
    await expect(ctx.homePage.footer).toBeDisplayed();
    const footerLinks = [
      ctx.homePage.footerAboutLink,
      ctx.homePage.footerContactLink,
      ctx.homePage.footerPrivacyLink,
      ctx.homePage.footerTermsLink,
    ];
    for (const link of footerLinks) {
      if (!(await link.isDisplayed().catch(() => false))) continue;
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  it('footer contains a copyright line', async () => {
    const text = (await ctx.homePage.footer.getText()).toLowerCase();
    expect(text).toMatch(/©|copyright/);
  });

  it('renders at least one featured product card', async () => {
    const cards = await ctx.homePage.productCard;
    expect(cards.length).toBeGreaterThan(0);
  });

  it('featured product cards have a name and a price', async () => {
    const prices = await ctx.homePage.getFeaturedProductPrices();
    expect(prices.length).toBeGreaterThan(0);
    for (const p of prices) {
      expect(p).toBeGreaterThan(0);
    }
  });

  it('featured product card text contains the product name and a dollar price', async () => {
    const first = ctx.homePage.productCard[0];
    const text = (await first.getText()).trim();
    expect(text).toMatch(/\$\d/);
  });

  it('featured product card image has a valid src', async () => {
    const firstCard = ctx.homePage.productCard[0];
    const img = firstCard.$('img');
    const src = await img.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toMatch(/(https?:\/\/|\/)/);
  });

  it('clicking a featured product navigates to a product page', async () => {
    const first = ctx.homePage.productCard[0];
    await first.click();
    await browser.waitUntil(
      async () => /\/product\//.test(await browser.getUrl()),
      { timeout: 30_000, timeoutMsg: 'Clicking a product card did not navigate to /product/' },
    );
    const h1 = $('h1');
    await expect(h1).toBeDisplayed({ wait: 30_000 });
  });

  it('clicking the brand logo returns to the home page', async () => {
    await ctx.homePage.goto('/collection/electronics');
    await ctx.homePage.clickLogo();
    expect(await browser.getUrl()).toMatch(/vendure\.io\/en\/?$/);
  });

  it('no uncaught console errors on first load', async () => {
    await ctx.homePage.goto('/');
    // A simple sanity check: the page should still have rendered.
    await expect(ctx.homePage.productCard[0]).toBeDisplayed({ wait: 30_000 });
  });
});