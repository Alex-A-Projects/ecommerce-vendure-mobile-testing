import { browser } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import { ProductListPage } from './ProductListPage';

/**
 * SearchPage — uses the same product-grid layout as the collection page,
 * plus a search form on the /search route. The mobile layout puts the
 * search bar at the top of the page in a sticky header.
 */
export class SearchPage extends ProductListPage {
  // Aliases for ergonomic spec code.
  readonly searchInput = this.headerSearchInput;
  readonly resultCards = this.productCards;
  readonly resultName = this.productCardName;
  readonly resultPrice = this.productCardPrice;

  constructor() {
    super();
  }

  async open(term?: string): Promise<void> {
    const path = term === undefined ? '/search' : `/search?q=${encodeURIComponent(term)}`;
    await this.goto(path);
    await this.assertLoaded();
  }

  async assertLoaded(): Promise<void> {
    await expect(browser).toHaveUrl(/\/en\/search/);
    await super.assertLoaded();
  }

  /** Submit the actual header form and wait for the requested results. */
  async search(term: string): Promise<void> {
    await this.searchInput.setValue(term);
    await browser.keys(['Enter']);
    await browser.waitUntil(
      async () => {
        const u = new URL(await browser.getUrl());
        return u.pathname === '/en/search' && (u.searchParams.get('q') ?? '') === term;
      },
      { timeout: 30_000, timeoutMsg: 'Header search did not reach /search?q=...' },
    );
    await this.assertLoaded();
  }

  async getResultCount(): Promise<number> {
    return this.getProductCount();
  }

  async getResultNames(): Promise<string[]> {
    return this.getVisibleProductNames();
  }
}

export default SearchPage;