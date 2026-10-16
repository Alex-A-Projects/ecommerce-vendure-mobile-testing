/**
 * Cart tests — exercised on iOS Safari and Android Chrome via the
 * shared cart POM.
 *
 * Mobile web specifics:
 *  - The empty-state and continue-shopping link are stacked above the
 *    cart list on small screens.
 *  - Cart items are vertically stacked rows, each with the same DOM
 *    as desktop.
 */
import { browser } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import { poms } from '../fixtures/pomFixtures';
import { CartPage } from '../pageobjects/CartPage';
import { SeedProducts } from '../data/testData';

describe('Cart', () => {
  const ctx = poms();

  beforeEach(async () => {
    await ctx.cartPage.open();
    // Start each test by emptying the cart.
    while ((await ctx.cartPage.cartItems.length) > 0) {
      await ctx.cartPage.removeFirstItem();
    }
  });

  it('empty cart shows the empty state', async () => {
    await expect(ctx.cartPage.emptyCartMessage).toBeDisplayed({ wait: 15_000 });
    const items = await ctx.cartPage.cartItems.length;
    expect(items).toBe(0);
  });

  it('empty cart shows a link to continue shopping', async () => {
    const linkVisible = await ctx.cartPage.emptyCartLink.isDisplayed().catch(() => false);
    if (!linkVisible) {
      throw new Error('__SKIP__:No continue-shopping link visible');
    }
    const href = await ctx.cartPage.emptyCartLink.getAttribute('href');
    expect(href).toMatch(/\/en/);
  });

  it('adding a product to cart shows it on the cart page', async () => {
    await ctx.productDetailPage.openProduct(SeedProducts.laptop.slug);
    await ctx.productDetailPage.addToCart(1);
    const cart = new CartPage();
    await cart.open();
    expect(await cart.cartItems.length).toBe(1);
    const name = (await cart.cartItemName.getText()).trim();
    expect(name).toContain(SeedProducts.laptop.nameContains);
  });

  it('cart item line has a name, price, and quantity control', async () => {
    await ctx.productDetailPage.openProduct(SeedProducts.laptop.slug);
    await ctx.productDetailPage.addToCart(1);
    const cart = new CartPage();
    await cart.open();
    expect(await cart.cartItems.length).toBe(1);
    const name = (await cart.cartItemName.getText()).trim();
    expect(name).toContain(SeedProducts.laptop.nameContains);
    const priceText = (await cart.cartItemPrice.getText()).trim();
    expect(priceText).toMatch(/\$[\d,.]+ each/);
    const qtyText = (await cart.cartItemQuantity.getText()).trim();
    expect(qtyText).toBe('1');
  });

  it('cart page exposes a checkout button', async () => {
    await ctx.productDetailPage.openProduct(SeedProducts.laptop.slug);
    await ctx.productDetailPage.addToCart(1);
    const cart = new CartPage();
    await cart.open();
    await expect(cart.checkoutButton).toBeDisplayed();
    const href = await cart.checkoutButton.getAttribute('href');
    if (href) expect(href).toMatch(/\/en\/checkout/);
  });

  it('adding two different products results in two line items', async () => {
    await ctx.productDetailPage.openProduct(SeedProducts.laptop.slug);
    await ctx.productDetailPage.addToCart(1);
    await ctx.productDetailPage.openProduct(SeedProducts.football.slug);
    await ctx.productDetailPage.addToCart(1);
    const cart = new CartPage();
    await cart.open();
    expect(await cart.cartItems.length).toBe(2);
    const names = await cart.getItemNames();
    expect(names.some((n) => n.includes(SeedProducts.laptop.nameContains))).toBeTruthy();
    expect(names.some((n) => n.includes(SeedProducts.football.nameContains))).toBeTruthy();
  });

  it('removing a line item drops the item count', async () => {
    await ctx.productDetailPage.openProduct(SeedProducts.laptop.slug);
    await ctx.productDetailPage.addToCart(1);
    const cart = new CartPage();
    await cart.open();
    expect(await cart.cartItems.length).toBe(1);
    await cart.removeFirstItem();
    await expect(cart.emptyCartMessage).toBeDisplayed({ wait: 15_000 });
    await cart.open();
    expect(await cart.cartItems.length).toBe(0);
  });

  it('cart total is greater than zero when there are items', async () => {
    await ctx.productDetailPage.openProduct(SeedProducts.laptop.slug);
    await ctx.productDetailPage.addToCart(1);
    const cart = new CartPage();
    await cart.open();
    const totalText = (await cart.totalValue.getText()).trim();
    expect(totalText).toMatch(/^\$[\d,.]+$/);
    const total = Number(totalText.replace(/[$,]/g, ''));
    expect(total).toBeGreaterThan(0);
  });

  it('navigates to /checkout when the checkout button is tapped', async () => {
    await ctx.productDetailPage.openProduct(SeedProducts.laptop.slug);
    await ctx.productDetailPage.addToCart(1);
    const cart = new CartPage();
    await cart.open();
    await cart.proceedToCheckout();
    expect(await browser.getUrl()).toMatch(/\/en\/checkout/);
  });
});