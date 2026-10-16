/**
 * POM fixtures for the mobile-web suite.
 *
 * WebdriverIO uses Mocha's `before` / `beforeEach` rather than
 * Playwright-style fixture injection. The helpers here wrap the page
 * objects so each test gets a freshly-constructed POM bound to the
 * current browser session. The factory pattern keeps spec code thin
 * (just import the factory and call it in `before`/`beforeEach`).
 *
 * Usage in a spec:
 *
 *   import { poms } from '@fixtures/pomFixtures';
 *
 *   describe('Home page', () => {
 *     const ctx = poms();
 *
 *     beforeEach(async () => {
 *       await ctx.homePage.open();
 *     });
 *
 *     it('renders the hero', async () => {
 *       await ctx.homePage.assertHeroVisible();
 *     });
 *   });
 */
import { HomePage } from '../pageobjects/HomePage';
import { ProductListPage } from '../pageobjects/ProductListPage';
import { ProductDetailPage } from '../pageobjects/ProductDetailPage';
import { CartPage } from '../pageobjects/CartPage';
import { CheckoutPage } from '../pageobjects/CheckoutPage';
import { AccountLoginPage } from '../pageobjects/AccountLoginPage';
import { AccountRegisterPage } from '../pageobjects/AccountRegisterPage';
import { AccountPage } from '../pageobjects/AccountPage';
import { SearchPage } from '../pageobjects/SearchPage';
import { SeedProducts } from '../data/testData';

export type PomContext = {
  homePage: HomePage;
  productListPage: ProductListPage;
  productDetailPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  accountLoginPage: AccountLoginPage;
  accountRegisterPage: AccountRegisterPage;
  accountPage: AccountPage;
  searchPage: SearchPage;
  /** The slug of a known-browseable product. */
  seededProductSlug: string;
};

/**
 * Factory that returns a fresh POM context. The POMs are constructed
 * once per call — they bind their selectors to the shared `browser`
 * instance so they work for any mobile-web session.
 */
export function poms(): PomContext {
  return {
    homePage: new HomePage(),
    productListPage: new ProductListPage(),
    productDetailPage: new ProductDetailPage(),
    cartPage: new CartPage(),
    checkoutPage: new CheckoutPage(),
    accountLoginPage: new AccountLoginPage(),
    accountRegisterPage: new AccountRegisterPage(),
    accountPage: new AccountPage(),
    searchPage: new SearchPage(),
    seededProductSlug: SeedProducts.laptop.slug,
  };
}

/**
 * Convenience: navigate to the seed product detail page. Useful for
 * tests that start on a deep-linked product page.
 */
export async function openSeedProduct(detail: ProductDetailPage): Promise<void> {
  await detail.openProduct(SeedProducts.laptop.slug);
}