import { browser, $, $$ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import type { ChainablePromiseArray, ChainablePromiseElement } from 'webdriverio';
import { BasePage } from './BasePage';

/**
 * The storefront cart, scoped to its heading container (there is no
 * <main> element on this page).
 *
 * The mobile layout puts cart rows into a stacked card list. Selectors
 * here target the same DOM the desktop uses; on mobile they resolve
 * to a single column.
 */
export class CartPage extends BasePage {
  readonly cartContents: ChainablePromiseElement;
  readonly cartItems: ChainablePromiseArray;
  readonly cartItemName: ChainablePromiseElement;
  readonly cartItemPrice: ChainablePromiseElement;
  readonly cartItemQuantity: ChainablePromiseElement;
  readonly cartItemTotal: ChainablePromiseElement;
  readonly cartItemRemove: ChainablePromiseElement;
  readonly emptyCartMessage: ChainablePromiseElement;
  readonly emptyCartLink: ChainablePromiseElement;
  readonly subtotalLabel: ChainablePromiseElement;
  readonly subtotalValue: ChainablePromiseElement;
  readonly shippingLabel: ChainablePromiseElement;
  readonly shippingValue: ChainablePromiseElement;
  readonly taxLabel: ChainablePromiseElement;
  readonly taxValue: ChainablePromiseElement;
  readonly totalLabel: ChainablePromiseElement;
  readonly totalValue: ChainablePromiseElement;
  readonly checkoutButton: ChainablePromiseElement;
  readonly continueShoppingLink: ChainablePromiseElement;

  constructor() {
    super();
    this.cartContents = $('div').$('*=Shopping Cart');
    this.cartItems = $$('div:has(> a[href*="/product/"] > img)');
    const firstItem = this.cartItems[0];
    this.cartItemName = firstItem.$('a[href*="/product/"]:not(:has(img))');
    this.cartItemPrice = firstItem.$('p*=each');
    this.cartItemQuantity = firstItem.$('span[class*="tabular"]');
    this.cartItemTotal = firstItem.$('p[class*="total"]');
    this.cartItemRemove = firstItem.$('button[aria-label*="remove"], button:has(svg.lucide-x)');

    this.emptyCartMessage = $('h2*=Your cart is empty');
    this.continueShoppingLink = $('a*=Continue shopping, button*=Continue shopping');
    this.emptyCartLink = this.continueShoppingLink;

    this.subtotalLabel = $('span=Subtotal');
    this.subtotalValue = $('span=Subtotal + span');
    this.shippingLabel = $('span=Shipping');
    this.shippingValue = $('span=Shipping + span');
    this.taxLabel = $('span=Tax');
    this.taxValue = $('span=Tax + span');
    this.totalLabel = $('span=Total');
    this.totalValue = $('span=Total + span');
    this.checkoutButton = $('a*=Proceed to checkout, button*=Proceed to checkout');
  }

  async open(): Promise<void> {
    await this.goto('/cart');
    await this.assertLoaded();
  }

  async assertLoaded(): Promise<void> {
    await browser.waitUntil(
      async () =>
        await this.emptyCartMessage.isDisplayed().catch(() => false) ||
        await this.checkoutButton.isDisplayed().catch(() => false),
      { timeout: 30_000, timeoutMsg: 'Cart never reached empty or filled state' },
    );
  }

  async getItemCount(): Promise<number> {
    await this.assertLoaded();
    return await this.cartItems.length;
  }

  async getItemNames(): Promise<string[]> {
    await this.assertLoaded();
    const cards = await this.cartItems;
    const names: string[] = [];
    for (const card of cards) {
      const link = card.$('a[href*="/product/"]:not(:has(img))');
      const text = (await link.getText().catch(() => '')).trim();
      if (text) names.push(text);
    }
    return names;
  }

  async removeFirstItem(): Promise<void> {
    const before = await this.getItemCount();
    if (before <= 0) throw new Error('Cart must contain an item to remove');
    await this.cartItemRemove.click();
    await browser.waitUntil(
      async () => (await this.cartItems.length) === before - 1,
      { timeout: 15_000, timeoutMsg: 'Removing the item did not reduce the cart count' },
    );
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
    await browser.waitUntil(
      async () => /\/checkout/.test(await browser.getUrl()),
      { timeout: 30_000, timeoutMsg: 'Cart did not navigate to /checkout' },
    );
  }
}

export default CartPage;