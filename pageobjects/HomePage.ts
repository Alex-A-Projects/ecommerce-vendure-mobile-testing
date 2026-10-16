import { browser, $, $$ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import type { ChainablePromiseArray, ChainablePromiseElement } from 'webdriverio';
import { BasePage } from './BasePage';

/**
 * HomePage — the storefront's landing page.
 *
 * - Hero / featured collections
 * - Featured product grid
 * - Newsletter signup (if present)
 *
 * On mobile web, "featured" cards appear as a single-column stack.
 * The selectors below target the same DOM elements that exist on
 * desktop but degrade gracefully when the layout wraps.
 */
export class HomePage extends BasePage {
  // Hero / featured
  readonly heroSection: ChainablePromiseElement;
  readonly heroHeading: ChainablePromiseElement;
  readonly heroCta: ChainablePromiseElement;

  // Featured product grid
  readonly featuredSection: ChainablePromiseElement;
  readonly featuredHeading: ChainablePromiseElement;
  readonly featuredProductCards: ChainablePromiseArray;

  // Generic product card (used in many places on the storefront)
  readonly productCard: ChainablePromiseArray;
  readonly productCardName: ChainablePromiseElement;
  readonly productCardPrice: ChainablePromiseElement;
  readonly productCardImage: ChainablePromiseElement;

  // Promotion / banner
  readonly promoBanner: ChainablePromiseElement;

  // Newsletter
  readonly newsletterSection: ChainablePromiseElement;
  readonly newsletterInput: ChainablePromiseElement;
  readonly newsletterSubmit: ChainablePromiseElement;

  constructor() {
    super();

    const sections = $$('main section:has(h2), main section:has(h1)');
    this.heroSection = sections[0] ?? $('main section');
    this.heroHeading = $('main h1');
    this.heroCta = $('main a*=Shop, main button*=Shop');

    // On the Vendure demo the second `main section` is the featured grid.
    this.featuredSection = sections[1] ?? this.heroSection;
    this.featuredHeading = this.featuredSection.$('h1, h2');
    this.featuredProductCards = this.featuredSection.$$('a[href*="/product/"]');

    this.productCard = $$('a[href*="/product/"]');
    const firstCard = this.productCard[0];
    this.productCardName = firstCard.$('h2, h3, [class*="name"]');
    this.productCardPrice = firstCard.$('[class*="price"], [data-testid*="price"]');
    this.productCardImage = firstCard.$('img');

    this.promoBanner = $('main [class*="banner"], main [class*="promo"]');

    this.newsletterSection = $('section:has(input[type="email"])');
    this.newsletterInput = $('input[type="email"]');
    this.newsletterSubmit = $('form:has(input[type="email"]) button[type="submit"]');
  }

  /** Open the home page. */
  async open(): Promise<void> {
    await this.goto('/');
    await this.assertLoaded();
  }

  /** Assert the hero is present. */
  async assertHeroVisible(): Promise<void> {
    await expect(this.heroHeading).toBeDisplayed({ wait: 15_000 });
  }

  /** Click the first featured product. */
  async clickFirstFeaturedProduct(): Promise<void> {
    const first = this.productCard[0];
    await first.click();
    await browser.waitUntil(
      async () => /\/product\//.test(await browser.getUrl()),
      { timeout: 30_000, timeoutMsg: 'Featured product click did not navigate to /product/...' },
    );
  }

  /** Get the names of all featured products visible on the home page. */
  async getFeaturedProductNames(): Promise<string[]> {
    const cards = await this.productCard;
    const names: string[] = [];
    for (const card of cards) {
      const name = await card.$('h2, h3').getText().catch(() => '');
      const trimmed = name.trim();
      if (trimmed) names.push(trimmed);
    }
    return names;
  }

  /**
   * Get the prices of all featured products. Reads the whole card text
   * and parses the first $-prefixed value, since the Remix storefront
   * puts the price in a non-classed <p>.
   */
  async getFeaturedProductPrices(): Promise<number[]> {
    const cards = await this.productCard;
    const prices: number[] = [];
    for (const card of cards) {
      const text = (await card.getText()).trim();
      const match = text.match(/\$([\d,]+\.\d+|\d+)/);
      if (match) {
        const parsed = Number(match[1].replace(/,/g, ''));
        if (!Number.isNaN(parsed) && parsed > 0) prices.push(parsed);
      }
    }
    return prices;
  }
}

export default HomePage;