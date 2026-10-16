import { $ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import type { ChainablePromiseArray, ChainablePromiseElement } from 'webdriverio';
import { BasePage } from './BasePage';

/**
 * AccountPage — customer account dashboard (post-login landing).
 *
 *   - Sidebar nav (orders, addresses, profile, etc.)
 *   - Order history list
 *   - Default shipping / billing address
 *   - Personal details form
 *
 * The mobile layout collapses the sidebar into a hamburger menu; the
 * selectors here still match because the DOM is the same — only the
 * CSS layout changes.
 */
export class AccountPage extends BasePage {
  readonly main: ChainablePromiseElement;
  readonly heading: ChainablePromiseElement;

  // Sidebar / nav
  readonly navOverview: ChainablePromiseElement;
  readonly navOrders: ChainablePromiseElement;
  readonly navAddresses: ChainablePromiseElement;
  readonly navProfile: ChainablePromiseElement;
  readonly navPassword: ChainablePromiseElement;
  readonly signOutLink: ChainablePromiseElement;

  // Order history
  readonly ordersList: ChainablePromiseElement;
  readonly orderItems: ChainablePromiseArray;
  readonly orderItemCode: ChainablePromiseElement;
  readonly orderItemDate: ChainablePromiseElement;
  readonly orderItemTotal: ChainablePromiseElement;
  readonly orderItemState: ChainablePromiseElement;
  readonly orderItemLink: ChainablePromiseElement;

  // Address book
  readonly defaultShippingAddress: ChainablePromiseElement;
  readonly defaultBillingAddress: ChainablePromiseElement;
  readonly addressBookEmpty: ChainablePromiseElement;
  readonly newAddressButton: ChainablePromiseElement;

  // Profile form
  readonly firstNameInput: ChainablePromiseElement;
  readonly lastNameInput: ChainablePromiseElement;
  readonly phoneInput: ChainablePromiseElement;
  readonly emailInput: ChainablePromiseElement;
  readonly updateProfileButton: ChainablePromiseElement;

  // Password form
  readonly currentPasswordInput: ChainablePromiseElement;
  readonly newPasswordInput: ChainablePromiseElement;
  readonly confirmNewPasswordInput: ChainablePromiseElement;
  readonly changePasswordButton: ChainablePromiseElement;

  constructor() {
    super();

    this.main = $('main');
    this.heading = $('main h1, h1');

    this.navOverview = this.main.$('a*=Overview, a*=Dashboard');
    this.navOrders = this.main.$('a*=Orders, a*=Order history');
    this.navAddresses = this.main.$('a*=Addresses, a*=Address book');
    this.navProfile = this.main.$('a*=Profile, a*=Personal details');
    this.navPassword = this.main.$('a*=Password, a*=Change password');
    this.signOutLink = this.main.$('button*=Sign out, a*=Sign out');

    this.ordersList = this.main.$('[class*="order"]');
    this.orderItems = this.main.$$('a[href*="/orders/"], tr:has(a[href*="/orders/"])');
    const firstOrder = (this.orderItems as any)[0] ?? this.main;
    this.orderItemCode = firstOrder.$('time');
    this.orderItemDate = firstOrder.$('time');
    this.orderItemTotal = firstOrder.$('[class*="total"]');
    this.orderItemState = firstOrder.$('[class*="state"], [class*="status"]');
    this.orderItemLink = firstOrder;

    this.defaultShippingAddress = this.main.$('section*=Shipping');
    this.defaultBillingAddress = this.main.$('section*=Billing');
    this.addressBookEmpty = this.main.$('p*=no address on file');
    this.newAddressButton = this.main.$('a*=New address, button*=Add address');

    this.firstNameInput = this.main.$('input[name*="firstName"], input#firstName');
    this.lastNameInput = this.main.$('input[name*="lastName"], input#lastName');
    this.phoneInput = this.main.$('input[type="tel"], input[name*="phone"]');
    this.emailInput = this.main.$('input[type="email"]');
    this.updateProfileButton = this.main.$('button*=Update, button*=Save');

    this.currentPasswordInput = this.main.$('input[type="password"][name*="current"], input#currentPassword');
    this.newPasswordInput = this.main.$('input[type="password"][name*="new"]:not([name*="confirm"]), input#newPassword');
    this.confirmNewPasswordInput = this.main.$('input[type="password"][name*="confirm"]');
    this.changePasswordButton = this.main.$('button*=Change password, button*=Update password');
  }

  async open(): Promise<void> {
    await this.goto('/account');
    await this.assertLoaded();
  }

  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeDisplayed({ wait: 15_000 });
  }

  async getOrderCount(): Promise<number> {
    return await this.orderItems.length;
  }

  async signOut(): Promise<void> {
    if (await this.signOutLink.isDisplayed().catch(() => false)) {
      await this.signOutLink.click();
    }
  }
}

export default AccountPage;