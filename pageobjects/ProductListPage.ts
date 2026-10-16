import { browser, $, $$ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import type { ChainablePromiseArray, ChainablePromiseElement } from 'webdriverio';
import { BasePage } from './BasePage';
import { ProductDetailPage } from './ProductDetailPage';

/**
 * ProductListPage — collection / category / search results.
 *
 * - Product grid
 * - Filters (facets) — collapsed on mobile behind a toggle, hidden in the markup
 * - Sort dropdown — only present on some pages
 * - Pagination
 *
 * The Vendure demo paginates by appending `?page=N` to the URL. On
 * mobile web the page renders a single column of cards; selectors
 * below target the same DOM as desktop but degrade gracefully when
 * the layout wraps.
 */
export class ProductListPage extends BasePage {
  // Layout
  readonly listingContent: ChainablePromiseElement;
  readonly heading: ChainablePromiseElement;
  readonly productGrid: ChainablePromiseElement;
  readonly productCards: ChainablePromiseArray;
  readonly resultsCount: ChainablePromiseElement;
  readonly emptyState: ChainablePromiseElement;

  // Individual product card
  readonly productCardName: ChainablePromiseElement;
  readonly productCardPrice: ChainablePromiseElement;
  readonly productCardImage: ChainablePromiseElement;
  readonly productCardLink: ChainablePromiseElement;

  // Filters
  readonly filterSidebar: ChainablePromiseElement;
  readonly filterHeading: ChainablePromiseElement;

  // Sort
  readonly sortSelect: ChainablePromiseElement;

  // Pagination
  readonly pagination: ChainablePromiseElement;
  readonly nextPageLink: ChainablePromiseElement;
  readonly prevPageLink: ChainablePromiseElement;

  constructor() {
    super();

    this.listingContent = $('div.container');
    this.heading = $('h1');
    this.productGrid = $('div.grid:has(> a[href*="/product/"])');
    this.productCards = $$('a[href*="/product/"]:has(img)');

    const first = this.productCards[0];
    this.productCardName = first.$('h2, h3');
    this.productCardPrice = first.$('h3 + p, [class*="price"]');
    this.productCardImage = first.$('img');
    this.productCardLink = first;

    this.resultsCount = $('span*=products');
    this.emptyState = $('*=no matching products, *=no products found');

    this.filterSidebar = $('[role="complementary"], aside');
    this.filterHeading = this.filterSidebar.$('h2, h3, legend');

    this.sortSelect = $('main select[name*="sort"], main select[aria-label*="sort"]');

    this.pagination = $('nav:has(a[href*="page="])');
    this.nextPageLink = this.pagination.$('a[href*="page="]');
    this.prevPageLink = this.pagination.$('a[href*="page="]');
  }

  /**
   * Open a collection page by slug. The Vendure Remix Storefront uses
   * /collection/<slug> (singular).
   */
  async openCollection(slug: string): Promise<void> {
    await this.goto(`/collection/${slug}`);
    await this.assertLoaded();
  }

  /**
   * Wait for the streamed listing to resolve to products or its empty state.
   * Mobile Safari sometimes paints late — wait for either outcome.
   */
  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeDisplayed({ wait: 30_000 });
    await browser.waitUntil(
      async () => {
        const cards = await this.productCards.length;
        const empty = await this.emptyState.isDisplayed().catch(() => false);
        return cards > 0 || empty;
      },
      { timeout: 30_000, timeoutMsg: 'Product listing did not render products or empty state' },
    );
  }

  /** Open the search results page for `term`. */
  async openSearch(term: string): Promise<void> {
    await this.goto(`/search?q=${encodeURIComponent(term)}`);
    await this.assertLoaded();
  }

  /** Open a product using the detail page's loading checks. */
  async openProduct(slug: string): Promise<void> {
    const detail = new ProductDetailPage();
    detail.setBaseUrl(this.getBaseUrl());
    await detail.openProduct(slug);
  }

  /**
   * Get all visible product names as a string array.
   * Skips names that are still empty (cards still streaming).
   */
  async getVisibleProductNames(): Promise<string[]> {
    await this.assertLoaded();
    const cards = await this.productCards;
    const names: string[] = [];
    for (const card of cards) {
      const text = (await card.$('h2, h3').getText().catch(() => '')).trim();
      if (text) names.push(text);
    }
    return names;
  }

  /** Read one price per card, including zero values so callers can reject them. */
  async getVisibleProductPrices(): Promise<number[]> {
    await this.assertLoaded();
    const cards = await this.productCards;
    const prices: number[] = [];
    for (const card of cards) {
      const priceText = (await card.$('h3 + p').getText().catch(() => '')).trim();
      const match = priceText.match(/(?:From\s*)?\$([\d,]+\.\d{2})/);
      if (match) prices.push(Number(match[1].replace(/,/g, '')));
    }
    return prices;
  }

  /** Count products currently visible. */
  async getProductCount(): Promise<number> {
    await this.assertLoaded();
    return await this.productCards.length;
  }

  /** Assert the page shows at least one product. */
  async assertHasProducts(): Promise<void> {
    await browser.waitUntil(
      async () => (await this.productCards.length) > 0,
      { timeout: 30_000, timeoutMsg: 'Expected the product list to have at least one product' },
    );
  }

  /** Change the sort order. Best-effort — not every storefront has a <select>. */
  async sortBy(value: string): Promise<void> {
    if (await this.sortSelect.isDisplayed().catch(() => false)) {
      await this.sortSelect.selectByVisibleText(value);
    }
  }

  /** Follow the next page and wait until its products replace the previous set. */
  async nextPage(): Promise<void> {
    await expect(this.nextPageLink).toBeDisplayed();
    const href = await this.nextPageLink.getAttribute('href');
    if (!href) throw new Error('Pagination next link has no href');
    const destination = new URL(href, await browser.getUrl());
    const firstProduct = await this.productCards[0].getAttribute('href');
    await this.nextPageLink.click();
    await browser.waitUntil(
      async () => (await browser.getUrl()) === destination.href,
      { timeout: 30_000, timeoutMsg: 'Pagination click did not navigate' },
    );
    await browser.waitUntil(
      async () => {
        const newFirst = await this.productCards[0].getAttribute('href');
        return newFirst && newFirst !== firstProduct;
      },
      { timeout: 30_000, timeoutMsg: 'Pagination did not refresh products' },
    );
    await this.assertLoaded();
  }
}

export default ProductListPage;