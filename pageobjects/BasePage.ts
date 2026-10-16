import { browser, $ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import type { ChainablePromiseElement } from 'webdriverio';
import { VendureEndpoints, StorefrontLocale } from '../data/testData';

/**
 * BasePage — shared behaviour for every Page Object.
 *
 * Provides:
 *  - The Vendure Remix Storefront global header / footer link locators
 *    which exist on every page.
 *  - Navigation helpers (open, goto).
 *  - Common waits for the main content area.
 *  - A `setBaseUrl` override so tests can target a clone.
 *
 * Selectors are written in plain CSS with `*=value` substring matches.
 * They are tuned to the current Vendure Remix Storefront layout but
 * degrade to "first match" so the same code works against minor markup
 * changes.
 */
export class BasePage {
  /** Canonical storefront base URL. */
  static readonly BASE_URL = VendureEndpoints.storefront;

  /** The base URL every POM uses for navigation. Override via setBaseUrl(). */
  protected baseUrl: string = BasePage.BASE_URL;

  // Global header
  readonly header: ChainablePromiseElement;
  readonly logoLink: ChainablePromiseElement;
  readonly navAllProducts: ChainablePromiseElement;
  readonly navElectronics: ChainablePromiseElement;
  readonly navSportswear: ChainablePromiseElement;
  readonly navHomeGarden: ChainablePromiseElement;
  readonly navGroceries: ChainablePromiseElement;
  readonly navFurniture: ChainablePromiseElement;
  readonly headerSearchInput: ChainablePromiseElement;
  readonly headerSearchButton: ChainablePromiseElement;
  readonly headerCartLink: ChainablePromiseElement;
  readonly headerAccountLink: ChainablePromiseElement;
  readonly headerSignInLink: ChainablePromiseElement;
  readonly headerSignOutLink: ChainablePromiseElement;
  readonly headerSignUpLink: ChainablePromiseElement;

  // Global footer
  readonly footer: ChainablePromiseElement;
  readonly footerAboutLink: ChainablePromiseElement;
  readonly footerContactLink: ChainablePromiseElement;
  readonly footerPrivacyLink: ChainablePromiseElement;
  readonly footerTermsLink: ChainablePromiseElement;
  readonly footerCopyright: ChainablePromiseElement;

  constructor() {
    // Header container — the Remix Storefront renders a real <header>.
    this.header = $('header, [role="banner"]');
    // The storefront logo is the first link inside the header.
    this.logoLink = $('header a, [role="banner"] a');
    this.navAllProducts = $('header a[href*="/search"]');
    this.navElectronics = $('header a[href*="electronics"]');
    this.navSportswear = $('header a[href*="sports"]');
    this.navHomeGarden = $('header a[href*="home-garden"], header a[href*="home"]');
    this.navGroceries = $('header a[href*="groceries"]');
    this.navFurniture = $('header a[href*="furniture"]');

    // Search box in the header — fall back through selectors so a
    // layout change doesn't break the spec.
    this.headerSearchInput = $(
      'header input[type="search"], header input[name*="search"], header input[placeholder*="search"]',
    );
    this.headerSearchButton = $(
      'header button[type="submit"]:has(svg), header button[aria-label*="search"]',
    );

    // Account / cart / sign-in links
    this.headerCartLink = $('header a[href*="/cart"], header a[aria-label*="cart"]');
    this.headerAccountLink = $('header a[href*="/account"], header a[aria-label*="account"]');
    this.headerSignInLink = $('header a[href*="/sign-in"], header a[href*="/signin"]');
    this.headerSignOutLink = $('header a[href*="sign-out"], header button*=Sign out');
    this.headerSignUpLink = $('header a[href*="/register"], header a[href*="/signup"]');

    // Footer
    this.footer = $('footer, [role="contentinfo"]');
    this.footerAboutLink = $('footer a[href*="about"], footer a*=About');
    this.footerContactLink = $('footer a[href*="contact"], footer a*=Contact');
    this.footerPrivacyLink = $('footer a[href*="privacy"], footer a*=Privacy');
    this.footerTermsLink = $('footer a[href*="terms"], footer a*=Terms');
    this.footerCopyright = this.footer;
  }

  /** Override the base URL for this instance (used for clones / staging). */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /** Get the base URL currently in use. */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Navigate to the supplied path (resolved against BASE_URL).
   * The Vendure demo storefront lives under /<locale> (locale prefix),
   * so relative paths are rewritten to /<locale>/<path> automatically.
   */
  async goto(path = ''): Promise<void> {
    const cleaned = path.startsWith('/') ? path.slice(1) : path;
    const base = this.baseUrl.replace(/\/$/, '');
    const url = cleaned ? `${base}/${StorefrontLocale}/${cleaned}` : `${base}/${StorefrontLocale}/`;
    await browser.url(url);
    await this.assertLoaded();
  }

  /** Wait for the page's main content area to be visible. */
  async assertLoaded(): Promise<void> {
    await expect($('main, [role="main"], body')).toBeDisplayed({ wait: 15_000 });
  }

  /** Get the current page <title>. */
  async getPageTitle(): Promise<string> {
    return await browser.getTitle();
  }

  /** Get the visible H1 (most page-level POMs use this). */
  async getPageHeading(): Promise<string> {
    const h1 = $('h1');
    if (!(await h1.isDisplayed().catch(() => false))) return '';
    return (await h1.getText()).trim();
  }

  /** Click the storefront logo to return to the home page. */
  async clickLogo(): Promise<void> {
    await this.logoLink.click();
    await browser.waitUntil(
      async () => /\/en\/?$/.test(await browser.getUrl()),
      { timeout: 30_000, timeoutMsg: 'Logo click did not return to home' },
    );
  }

  /** Open the cart page from the header. */
  async openCart(): Promise<void> {
    await this.headerCartLink.click();
    await browser.waitUntil(
      async () => /\/cart/.test(await browser.getUrl()),
      { timeout: 30_000, timeoutMsg: 'Cart link did not navigate to /cart' },
    );
  }

  /** Use the header search box to search for `term`. */
  async search(term: string): Promise<void> {
    if (await this.headerSearchInput.isDisplayed().catch(() => false)) {
      await this.headerSearchInput.setValue(term);
      const buttonVisible = await this.headerSearchButton.isDisplayed().catch(() => false);
      if (buttonVisible) {
        await this.headerSearchButton.click();
      } else {
        // Submit the form by pressing Enter inside the input.
        await browser.keys(['Enter']);
      }
    }
  }
}

export default BasePage;