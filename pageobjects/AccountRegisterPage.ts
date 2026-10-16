import { browser, $ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import type { ChainablePromiseElement } from 'webdriverio';
import { BasePage } from './BasePage';

/**
 * AccountRegisterPage — customer registration form.
 *
 * The Vendure Remix Storefront exposes registration at /register (not
 * /account/register).
 */
export class AccountRegisterPage extends BasePage {
  readonly heading: ChainablePromiseElement;
  readonly firstNameInput: ChainablePromiseElement;
  readonly lastNameInput: ChainablePromiseElement;
  readonly emailInput: ChainablePromiseElement;
  readonly passwordInput: ChainablePromiseElement;
  readonly confirmPasswordInput: ChainablePromiseElement;
  readonly phoneInput: ChainablePromiseElement;
  readonly titleSelect: ChainablePromiseElement;
  readonly submitButton: ChainablePromiseElement;
  readonly signInLink: ChainablePromiseElement;
  readonly errorMessage: ChainablePromiseElement;
  readonly successMessage: ChainablePromiseElement;

  constructor() {
    super();

    this.heading = $('h1, h2');
    // The Vendure Remix Storefront uses untyped <input> elements.
    this.firstNameInput = $('input[name*="firstName"], input#firstName');
    this.lastNameInput = $('input[name*="lastName"], input#lastName');
    this.emailInput = $('input[type="email"]');
    this.passwordInput = $('form input[type="password"]:not([name*="confirm"])');
    this.confirmPasswordInput = $('form input[type="password"][name*="confirm"], form input[type="password"][name*="repeat"]');
    this.phoneInput = $('input[type="tel"], input[name*="phone"]');
    this.titleSelect = $('select[name*="title"]');
    this.submitButton = $('form button[type="submit"]');
    this.signInLink = $('a[href*="/sign-in"], a*=Sign in, a*=Log in');
    this.errorMessage = $('[role="alert"], [class*="error"]');
    this.successMessage = $('[role="status"], [class*="success"]');
  }

  async open(): Promise<void> {
    await this.goto('/register');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeDisplayed({ wait: 15_000 });
  }

  /** Fill the form. Any undefined value is skipped. */
  async fillForm(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
    title?: string;
  }): Promise<void> {
    if (data.title) await this.titleSelect.selectByVisibleText(data.title);
    if (data.firstName) await this.firstNameInput.setValue(data.firstName);
    if (data.lastName) await this.lastNameInput.setValue(data.lastName);
    if (data.email) await this.emailInput.setValue(data.email);
    if (data.phone) await this.phoneInput.setValue(data.phone);
    if (data.password) await this.passwordInput.setValue(data.password);
    if (data.confirmPassword) await this.confirmPasswordInput.setValue(data.confirmPassword);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
    // Wait for either a navigation or a status message to appear.
    await browser.waitUntil(
      async () => {
        const url = await browser.getUrl();
        return !/\/register$/.test(url);
      },
      { timeout: 15_000, timeoutMsg: 'Registration did not produce an observable outcome' },
    );
  }

  async getError(): Promise<string> {
    if (await this.errorMessage.isDisplayed().catch(() => false)) {
      return (await this.errorMessage.getText()).trim();
    }
    return '';
  }
}

export default AccountRegisterPage;