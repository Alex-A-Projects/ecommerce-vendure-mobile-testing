import { browser, $ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import type { ChainablePromiseElement } from 'webdriverio';
import { BasePage } from './BasePage';

/**
 * AccountLoginPage — sign-in form.
 *
 * The Vendure Remix Storefront exposes the sign-in page at /sign-in
 * (not /account/login). Visiting any /account/* route also redirects
 * here when the user is not authenticated.
 */
export class AccountLoginPage extends BasePage {
  readonly emailInput: ChainablePromiseElement;
  readonly passwordInput: ChainablePromiseElement;
  readonly submitButton: ChainablePromiseElement;
  readonly registerLink: ChainablePromiseElement;
  readonly forgotPasswordLink: ChainablePromiseElement;
  readonly errorMessage: ChainablePromiseElement;
  readonly successMessage: ChainablePromiseElement;
  readonly heading: ChainablePromiseElement;

  constructor() {
    super();

    this.heading = $('h1, h2');
    // The Vendure Remix Storefront uses untyped <input> elements inside
    // a form — match by type only, not by name.
    this.emailInput = $('input[type="email"]');
    this.passwordInput = $('input[type="password"]');
    this.submitButton = $('form button[type="submit"]');
    this.registerLink = $('a[href*="/register"], a*=Register, a*=Sign up');
    this.forgotPasswordLink = $('a[href*="/forgot"], a*=Forgot');
    this.errorMessage = $('[role="alert"], [class*="error"]');
    this.successMessage = $('[role="status"], [class*="success"]');
  }

  async open(): Promise<void> {
    await this.goto('/sign-in');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeDisplayed({ wait: 15_000 });
  }

  /** Fill + submit the form. */
  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.setValue(email);
    await this.passwordInput.setValue(password);
    await this.submitButton.click();
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl();
        return /\/account/.test(url) || /verify|invalid|incorrect/i.test(await browser.$('body').getText().catch(() => ''));
      },
      { timeout: 15_000, timeoutMsg: 'Sign-in did not reach a known outcome' },
    );
  }

  /** Get the visible error message (empty if none). */
  async getError(): Promise<string> {
    if (await this.errorMessage.isDisplayed().catch(() => false)) {
      return (await this.errorMessage.getText()).trim();
    }
    return '';
  }
}

export default AccountLoginPage;