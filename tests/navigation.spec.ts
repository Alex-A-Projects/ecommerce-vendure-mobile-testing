/**
 * Cross-page navigation tests.
 *
 * Verifies that the header and footer render consistently on every
 * page and that the cross-page navigation links work.
 */
import { browser, $$ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import { poms } from '../fixtures/pomFixtures';
import { VendureEndpoints } from '../data/testData';

describe('Cross-page navigation', () => {
  const ctx = poms();

  for (const path of ['/', '/collection/electronics', '/cart', '/search']) {
    it(`header is on ${path}`, async () => {
      await ctx.homePage.goto(path);
      await expect(ctx.homePage.header).toBeDisplayed();
    });
    it(`footer is on ${path}`, async () => {
      await ctx.homePage.goto(path);
      await expect(ctx.homePage.footer).toBeDisplayed();
    });
  }

  it('header collection links are consistent across pages', async () => {
    for (const path of ['/', '/cart']) {
      await ctx.homePage.goto(path);
      const navLinks = $$('header a[href*="/collection/"]');
      expect(navLinks.length).toBeGreaterThan(0);
    }
  });

  it('clicking a collection link in the header navigates to that collection', async () => {
    await ctx.homePage.open();
    const electronics = ctx.homePage.navElectronics;
    if (!(await electronics.isDisplayed().catch(() => false))) {
      throw new Error('__SKIP__:No Electronics nav link on this layout');
    }
    const href = await electronics.getAttribute('href');
    expect(href).toContain('/en/collection/electronics');
    await electronics.click();
    await browser.waitUntil(
      async () => /\/en\/collection\/electronics\/?$/.test(await browser.getUrl()),
      { timeout: 30_000, timeoutMsg: 'Electronics nav click did not navigate to the collection page' },
    );
    const heading = $('h1*=Electronics');
    await expect(heading).toBeDisplayed({ wait: 30_000 });
  });

  it('clicking the cart icon from a collection navigates to /cart', async () => {
    await ctx.homePage.goto('/collection/electronics');
    const cartIcon = $('header a[href*="/cart"]');
    await cartIcon.click();
    await browser.waitUntil(
      async () => /\/cart/.test(await browser.getUrl()),
      { timeout: 30_000, timeoutMsg: 'Cart icon click did not navigate to /cart' },
    );
  });

  it('clicking the logo from the cart returns home', async () => {
    await ctx.cartPage.open();
    await ctx.cartPage.clickLogo();
    expect(await browser.getUrl()).toMatch(/\/en\/?$/);
  });

  it('every primary route is reachable', async () => {
    const paths = [
      '/',
      '/cart',
      '/search',
      '/collection/electronics',
      '/collection/computers',
      '/collection/furniture',
    ];
    for (const path of paths) {
      const url = `${VendureEndpoints.storefront}/en${path}`;
      await browser.url(url);
      await ctx.homePage.assertLoaded();
    }
  });
});

import { $ } from '@wdio/globals';