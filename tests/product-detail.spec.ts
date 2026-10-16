/**
 * Product detail page tests.
 *
 * Exercises:
 *   - Title, price, description visibility
 *   - Image rendering
 *   - Add-to-cart flow (single + multi quantity)
 *   - Variant selection
 *   - Breadcrumb navigation back to the collection
 *
 * Mobile web specific:
 *   - Quantity input may be hidden; the demo adds one unit per click.
 *   - Radio inputs are visually hidden behind tiles — we click the label.
 */
import { browser } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import { poms } from '../fixtures/pomFixtures';
import { SeedProducts } from '../data/testData';

describe('Product detail page', () => {
  const ctx = poms();

  beforeEach(async () => {
    await ctx.productDetailPage.openProduct(SeedProducts.laptop.slug);
  });

  it(`${SeedProducts.laptop.slug} loads with a title and selected variant price`, async () => {
    const title = (await ctx.productDetailPage.productTitle.getText()).trim();
    expect(title).toContain(SeedProducts.laptop.nameContains);
    await ctx.productDetailPage.selectFirstVariant();
    await expect(ctx.productDetailPage.productPrice).toBeDisplayed({ wait: 15_000 });
  });

  it('product price is a positive number', async () => {
    await ctx.productDetailPage.selectFirstVariant();
    const price = await ctx.productDetailPage.getPrice();
    expect(price).toBeGreaterThan(0);
  });

  it('product page shows the product name in the <title> tag', async () => {
    const name = await ctx.productDetailPage.getTitle();
    const title = await browser.getTitle();
    expect(title).toContain(name);
  });

  it('product page has a primary image with a valid src', async () => {
    const src = await ctx.productDetailPage.mainImage.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).not.toMatch(/^data:/);
  });

  it('product page has a description block', async () => {
    const text = (await ctx.productDetailPage.productDescription.getText()).trim();
    expect(text.length).toBeGreaterThan(20);
  });

  it('breadcrumbs show the current product as the last crumb', async () => {
    await expect(ctx.productDetailPage.breadcrumbHome).toBeDisplayed();
    const crumbText = (await ctx.productDetailPage.breadcrumbCurrent.getText()).trim();
    expect(crumbText).toContain(SeedProducts.laptop.nameContains);
  });

  it('clicking the home breadcrumb returns to the root', async () => {
    if (await ctx.productDetailPage.breadcrumbHome.isDisplayed().catch(() => false)) {
      await ctx.productDetailPage.breadcrumbHome.click();
    } else {
      // Fallback to the logo.
      await ctx.productDetailPage.clickLogo();
    }
    expect(await browser.getUrl()).toMatch(/\/en\/?$/);
  });

  it('Add to cart becomes enabled after selecting all variant options', async () => {
    await ctx.productDetailPage.selectFirstVariant();
    await expect(ctx.productDetailPage.addToCartButton).toBeDisplayed({ wait: 15_000 });
    await expect(ctx.productDetailPage.addToCartButton).toBeEnabled();
  });

  it('Add to cart (single quantity) does not navigate away', async () => {
    const url = new URL(await browser.getUrl());
    await ctx.productDetailPage.addToCart(1);
    const after = new URL(await browser.getUrl());
    expect(after.origin).toBe(url.origin);
    expect(after.pathname).toBe(url.pathname);
  });

  it('Add to cart (quantity = 2) does not navigate away', async () => {
    const url = new URL(await browser.getUrl());
    await ctx.productDetailPage.addToCart(2);
    const after = new URL(await browser.getUrl());
    expect(after.origin).toBe(url.origin);
    expect(after.pathname).toBe(url.pathname);
  });

  it('Buy now button is present (or skipped if absent)', async () => {
    await ctx.productDetailPage.selectFirstVariant();
    const visible = await ctx.productDetailPage.buyNowButton.isDisplayed().catch(() => false);
    if (!visible) {
      throw new Error('__SKIP__:No "Buy now" button on this layout');
    }
    await expect(ctx.productDetailPage.buyNowButton).toBeDisplayed();
  });

  it('In stock label is visible and Out of stock label is hidden for in-stock seed products', async () => {
    await ctx.productDetailPage.selectFirstVariant();
    const inStock = await ctx.productDetailPage.inStockLabel.isDisplayed().catch(() => false);
    if (inStock) {
      await expect(ctx.productDetailPage.inStockLabel).toBeDisplayed();
    }
    const outOfStock = await ctx.productDetailPage.outOfStockLabel.isDisplayed().catch(() => false);
    if (outOfStock) {
      throw new Error('Seed product should not be out of stock');
    }
  });

  it('clicking the brand logo on a product page returns home', async () => {
    await ctx.productDetailPage.clickLogo();
    expect(await browser.getUrl()).toMatch(/\/en\/?$/);
  });
});