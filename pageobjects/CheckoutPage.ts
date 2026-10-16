import { browser, $, $$ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import type { ChainablePromiseArray, ChainablePromiseElement } from 'webdriverio';
import { BasePage } from './BasePage';

export type CheckoutAddress = {
  fullName: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string;
};

/**
 * CheckoutPage — guest checkout: contact, address, delivery, payment,
 * review. The mobile layout collapses these into a stacked accordion
 * with the same section roles the desktop uses.
 */
export class CheckoutPage extends BasePage {
  readonly heading: ChainablePromiseElement;
  readonly contactSection: ChainablePromiseElement;
  readonly addressSection: ChainablePromiseElement;
  readonly deliverySection: ChainablePromiseElement;
  readonly paymentSection: ChainablePromiseElement;
  readonly reviewSection: ChainablePromiseElement;
  readonly emailInput: ChainablePromiseElement;
  readonly firstNameInput: ChainablePromiseElement;
  readonly lastNameInput: ChainablePromiseElement;
  readonly fullNameInput: ChainablePromiseElement;
  readonly streetInput: ChainablePromiseElement;
  readonly cityInput: ChainablePromiseElement;
  readonly provinceInput: ChainablePromiseElement;
  readonly postalCodeInput: ChainablePromiseElement;
  readonly countrySelect: ChainablePromiseElement;
  readonly phoneInput: ChainablePromiseElement;
  readonly shippingOptions: ChainablePromiseArray;
  readonly paymentOptions: ChainablePromiseArray;
  readonly orderSummary: ChainablePromiseElement;
  readonly summaryTotal: ChainablePromiseElement;
  readonly placeOrderButton: ChainablePromiseElement;

  constructor() {
    super();
    this.heading = $('h1=Checkout');
    this.contactSection = $('[role="region"]*=Contact Information, section*=Contact Information');
    this.addressSection = $('[role="region"]*=Shipping Address, section*=Shipping Address');
    this.deliverySection = $('[role="region"]*=Delivery Method, section*=Delivery Method');
    this.paymentSection = $('[role="region"]*=Payment Method, section*=Payment Method');
    this.reviewSection = $('[role="region"]*=Review, section*=Review');

    this.emailInput = this.contactSection.$('input[type="email"]');
    this.firstNameInput = this.contactSection.$('input[name*="firstName"]');
    this.lastNameInput = this.contactSection.$('input[name*="lastName"]');
    this.fullNameInput = this.addressSection.$('input[name*="fullName"]');
    this.streetInput = this.addressSection.$('input[name*="street"]');
    this.cityInput = this.addressSection.$('input[name*="city"]');
    this.provinceInput = this.addressSection.$('input[name*="province"], input[name*="state"]');
    this.postalCodeInput = this.addressSection.$('input[name*="postal"], input[name*="zip"]');
    this.countrySelect = this.addressSection.$('select');
    this.phoneInput = this.addressSection.$('input[type="tel"], input[name*="phone"]');

    this.shippingOptions = this.deliverySection.$$('[role="radio"]');
    this.paymentOptions = this.paymentSection.$$('[role="radio"]');

    this.orderSummary = $('div*=Order Summary');
    this.summaryTotal = this.orderSummary.$('span=Total + span');

    this.placeOrderButton = this.reviewSection.$('button*=Place order');
  }

  async open(): Promise<void> {
    await this.goto('/checkout');
    await this.assertLoaded();
  }

  async assertLoaded(): Promise<void> {
    await expect(this.heading).toBeDisplayed({ wait: 15_000 });
    await expect(this.emailInput).toBeDisplayed({ wait: 15_000 });
  }

  async setEmail(email: string): Promise<void> {
    await this.emailInput.setValue(email);
  }

  async fillContact(email: string, firstName: string, lastName: string): Promise<void> {
    await this.setEmail(email);
    await this.firstNameInput.setValue(firstName);
    await this.lastNameInput.setValue(lastName);
    await this.contactSection.$('button=Continue').click();
    await expect(this.fullNameInput).toBeDisplayed({ wait: 30_000 });
  }

  async fillAddress(address: CheckoutAddress): Promise<void> {
    await this.fullNameInput.setValue(address.fullName);
    await this.streetInput.setValue(address.street);
    await this.cityInput.setValue(address.city);
    await this.provinceInput.setValue(address.province);
    await this.postalCodeInput.setValue(address.postalCode);
    await this.phoneInput.setValue(address.phone);
    await this.countrySelect.click();
    // The country <select> renders an option list — match by visible text.
    await $(`[role="option"]=${address.country}`).click();
    await this.addressSection.$('button=Continue').click();
    await expect(this.shippingOptions[0]).toBeDisplayed({ wait: 30_000 });
  }

  async selectFirstShipping(): Promise<void> {
    await this.shippingOptions[0].click();
    await this.deliverySection.$('button*=Continue to payment').click();
    await expect(this.paymentSection).toBeDisplayed({ wait: 30_000 });
  }

  async selectFirstPayment(): Promise<void> {
    await this.paymentOptions[0].click();
    await this.paymentSection.$('button*=Continue to review').click();
    // The accordion opens before the saved order details finish refreshing.
    await browser.waitUntil(
      async () => await this.placeOrderButton.isEnabled(),
      { timeout: 30_000, timeoutMsg: 'Place-order button never became enabled' },
    );
  }
}

export default CheckoutPage;