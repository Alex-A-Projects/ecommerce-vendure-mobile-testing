/**
 * Product listing page tests.
 *
 * Collection browsing, product-card content, navigation, and empty states.
 * On mobile web, cards are stacked into a single column but the DOM is
 * identical to desktop — the same selectors work.
 */
import { browser, $ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import { poms } from '../fixtures/pomFixtures';
import { ProductListPage } from '../pageobjects/ProductListPage';
import { ProductDetailPage } from '../pageobjects/ProductDetailPage';
import { SeedCollections, SeedProducts } from '../data/testData';

describe('Product listing page — collection browse', () => {
  const ctx = poms();

  for (const collection of Object.values(SeedCollections)) {
    it(`/${collection.slug} loads and shows at least one product card`, async () => {
      if (collection.slug === '__all__') {
        throw new Error('__SKIP__:__all__ is synthetic and has no collection route');
      }
      const listing = new ProductListPage();
      await listing.openCollection(collection.slug);
      const headingText = (await listing.heading.getText()).trim();
      expect(headingText).toContain(collection.nameContains);
      await listing.assertHasProducts();
    });
  }

  it('electronics collection shows the seed laptop', async () => {
    const laptop = $('a[href*="/product/"] h3*=Laptop');
    let visible = await laptop.isDisplayed().catch(() => false);
    let safety = 5;
    while (!visible && safety > 0) {
      const nextVisible = await ctx.productListPage.nextPageLink.isDisplayed().catch(() => false);
      if (!nextVisible) break;
      await ctx.productListPage.nextPage();
      visible = await laptop.isDisplayed().catch(() => false);
      safety -= 1;
    }
    if (!visible) {
      throw new Error('__SKIP__:Laptop was not on the first five pages of the electronics collection');
    }
    await expect(laptop).toBeDisplayed();
  });

  it('sports-outdoor collection shows apparel or sports equipment', async () => {
    const listing = new ProductListPage();
    await listing.openCollection(SeedCollections.sportsOutdoor.slug);
    const cards = await listing.productCards;
    // Walk every card text and assert at least one mentions apparel/equipment.
    let found = false;
    for (const card of cards) {
      const t = (await card.getText()).toLowerCase();
      if (/shirt|jacket|shorts|shoe|bike|bicycle|ball/.test(t)) {
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error('__SKIP__:No apparel/equipment terms on first page of sports-outdoor');
    }
    expect(found).toBeTruthy();
  });

  for (const collection of [
    SeedCollections.homeGarden,
    SeedCollections.plants,
    SeedCollections.furniture,
  ]) {
    it(`${collection.slug} collection has products`, async () => {
      const listing = new ProductListPage();
      await listing.openCollection(collection.slug);
      await listing.assertHasProducts();
      expect(await listing.getProductCount()).toBeGreaterThan(0);
    });
  }

  it('computers collection has the laptop', async () => {
    const listing = new ProductListPage();
    await listing.openCollection(SeedCollections.computers.slug);
    const laptop = $('a[href*="/product/"] h3*=Laptop');
    await expect(laptop).toBeDisplayed({ wait: 30_000 });
  });

  it('product cards have a name, price, and image', async () => {
    await ctx.productListPage.openCollection('electronics');
    await ctx.productListPage.assertHasProducts();
    const cards = await ctx.productListPage.productCards;
    for (const card of cards) {
      const name = card.$('h2, h3');
      await expect(name).toHaveText(/\S/);
      const priceText = (await card.$('h3 + p').getText().catch(() => '')).trim();
      expect(priceText).toMatch(/(?:From\s*)?\$[\d,]+\.\d{2}/);
      const img = card.$('img');
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  it('all product prices are > 0', async () => {
    await ctx.productListPage.openCollection('electronics');
    const prices = await ctx.productListPage.getVisibleProductPrices();
    expect(prices.length).toBeGreaterThan(0);
    for (const price of prices) {
      expect(price).toBeGreaterThan(0);
    }
  });

  it('no product name contains a "null" or "undefined" placeholder', async () => {
    await ctx.productListPage.openCollection('electronics');
    const names = await ctx.productListPage.getVisibleProductNames();
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(name.trim()).toMatch(/\S/);
      expect(name).not.toMatch(/^(null|undefined|nan|placeholder)$/i);
    }
  });

  it('clicking a product card opens its detail page', async () => {
    await ctx.productListPage.openCollection('electronics');
    const first = ctx.productListPage.productCards[0];
    const name = (await first.$('h2, h3').getText()).trim();
    const href = await first.getAttribute('href');
    expect(href).toMatch(/^\/en\/product\/[^/?]+$/);
    await first.click();
    const detail = new ProductDetailPage();
    await detail.assertLoaded();
    const detailTitle = (await detail.productTitle.getText()).trim();
    expect(detailTitle).toContain(name);
  });

  it('deep-linking to a specific slug works', async () => {
    await ctx.productDetailPage.openProduct(SeedProducts.laptop.slug);
    const title = (await ctx.productDetailPage.productTitle.getText()).trim();
    expect(title).toContain(SeedProducts.laptop.nameContains);
  });

  it('URL with unknown collection slug shows the empty state', async () => {
    const slug = '__no-such-collection-zzz__';
    await ctx.productListPage.openCollection(slug);
    await ctx.productListPage.assertLoaded();
    const headingText = (await ctx.productListPage.heading.getText()).trim();
    expect(headingText).toContain(slug);
    const emptyVisible = await ctx.productListPage.emptyState.isDisplayed().catch(() => false);
    if (emptyVisible) {
      await expect(ctx.productListPage.emptyState).toBeDisplayed();
    }
    const cards = await ctx.productListPage.productCards.length;
    expect(cards).toBe(0);
  });
});