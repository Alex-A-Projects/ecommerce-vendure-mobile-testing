/**
 * Search tests.
 *
 * - Header search form submission
 * - /search?q=... deep links
 * - Result quality and empty states
 */
import { expect } from 'expect-webdriverio';
import { $ } from '@wdio/globals';
import { poms } from '../fixtures/pomFixtures';
import { SearchPage } from '../pageobjects/SearchPage';
import { SeedProducts, SeedSearchTerms } from '../data/testData';

describe('Search', () => {
  const ctx = poms();

  it('searching for an existing term returns at least one result', async () => {
    const search = new SearchPage();
    await search.open(SeedSearchTerms.exactMatch);
    await expect(search.resultCards[0]).toBeDisplayed({ wait: 30_000 });
    expect(await search.getResultCount()).toBeGreaterThan(0);
  });

  it('searching for a nonsense term returns no results', async () => {
    const search = new SearchPage();
    await search.open(SeedSearchTerms.noResults);
    await expect(search.emptyState).toBeDisplayed({ wait: 30_000 });
    expect(await search.resultCards.length).toBe(0);
  });

  it('searching for "bike" returns the road bike', async () => {
    const search = new SearchPage();
    await search.open(SeedSearchTerms.broad);
    const bikeCard = $('a[href*="/product/"] h3*=Road Bike');
    await expect(bikeCard).toBeDisplayed({ wait: 30_000 });
  });

  it('searching for "laptop" returns the laptop', async () => {
    const search = new SearchPage();
    await search.open(SeedSearchTerms.exactMatch);
    const name = (await search.resultName.getText()).trim();
    expect(name).toContain(SeedProducts.laptop.nameContains);
    const href = await search.resultCards[0].getAttribute('href');
    expect(href).toContain(`/en/product/${SeedProducts.laptop.slug}`);
  });

  it('unmatched plural query "bikes" shows the empty state', async () => {
    const search = new SearchPage();
    await search.open(SeedSearchTerms.plural);
    await expect(search.emptyState).toBeDisplayed({ wait: 30_000 });
    expect(await search.resultCards.length).toBe(0);
  });

  it('search input on /search route is interactive', async () => {
    const search = new SearchPage();
    await search.open();
    await expect(search.searchInput).toBeDisplayed();
    await search.search(SeedSearchTerms.exactMatch);
    const value = await search.searchInput.getValue();
    expect(value).toBe(SeedSearchTerms.exactMatch);
    const name = (await search.resultName.getText()).trim();
    expect(name).toContain(SeedProducts.laptop.nameContains);
  });

  it('case-insensitive search returns the same result', async () => {
    const search = new SearchPage();
    await search.open(SeedSearchTerms.exactMatch.toUpperCase());
    const upperNames = await search.getResultNames();
    expect(upperNames.some((n) => n.includes(SeedProducts.laptop.nameContains))).toBeTruthy();

    await search.open(SeedSearchTerms.exactMatch.toLowerCase());
    const lowerNames = await search.getResultNames();
    expect(lowerNames).toEqual(upperNames);
  });

  it('search results have a name, price, and image', async () => {
    const search = new SearchPage();
    await search.open(SeedSearchTerms.exactMatch);
    await expect(search.resultCards[0]).toBeDisplayed();
    const cards = await search.resultCards;
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

  it('empty search query shows the product catalog', async () => {
    const search = new SearchPage();
    await search.open('');
    await expect(search.resultCards[0]).toBeDisplayed({ wait: 30_000 });
  });

  it('searching for special characters shows the empty state without crashing', async () => {
    const term = '!@#$%^&*()';
    const search = new SearchPage();
    await search.open(term);
    await expect(search.emptyState).toBeDisplayed({ wait: 30_000 });
    expect(await search.resultCards.length).toBe(0);
  });
});