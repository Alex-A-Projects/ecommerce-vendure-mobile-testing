import { browser, $, $$ } from '@wdio/globals';
import { expect } from 'expect-webdriverio';
import type { ChainablePromiseArray, ChainablePromiseElement } from 'webdriverio';
import { BasePage } from './BasePage';

/**
 * ProductDetailPage — single product / product variant.
 *
 * - Product images
 * - Title, price, description
 * - Variant pickers (radio groups)
 * - Quantity selector (the demo uses per-click add-to-cart)
 * - Add-to-cart button
 * - Breadcrumbs
 *
 * On mobile web, the variant group collapses into a horizontal scroll;
 * the selectors below target the same DOM as desktop.
 */
export class ProductDetailPage extends BasePage {
  // Layout
  readonly productMain: ChainablePromiseElement;
  readonly breadcrumbs: ChainablePromiseElement;
  readonly breadcrumbHome: ChainablePromiseElement;
  readonly breadcrumbCurrent: ChainablePromiseElement;

  // Images
  readonly mainImage: ChainablePromiseElement;
  readonly thumbnailImages: ChainablePromiseArray;

  // Title / price / description
  readonly productTitle: ChainablePromiseElement;
  readonly productPrice: ChainablePromiseElement;
  readonly productDescription: ChainablePromiseElement;
  readonly productSku: ChainablePromiseElement;

  // Variants
  readonly variantGroup: ChainablePromiseElement;
  readonly variantOptions: ChainablePromiseArray;
  readonly variantOption: ChainablePromiseElement;

  // Quantity + add to cart
  readonly quantityInput: ChainablePromiseElement;
  readonly quantityDecrement: ChainablePromiseElement;
  readonly quantityIncrement: ChainablePromiseElement;
  readonly addToCartButton: ChainablePromiseElement;
  readonly buyNowButton: ChainablePromiseElement;

  // Stock state
  readonly outOfStockLabel: ChainablePromiseElement;
  readonly inStockLabel: ChainablePromiseElement;

  // Cart indicator in the header — used to assert the cart count
  readonly headerCartButton: ChainablePromiseElement;

  constructor() {
    super();

    // The product container excludes the header, footer, and related products.
    this.productMain = $('div.container');
    this.breadcrumbs = this.productMain.$('[aria-label="breadcrumb"], nav*=breadcrumb');
    this.breadcrumbHome = this.breadcrumbs.$('a[href="/"], a*=Home');
    // Fall back to the whole breadcrumb container if no <li>/<span> items
    // are present (the demo's breadcrumbs may render as <a>).
    this.breadcrumbCurrent = this.breadcrumbs;

    this.mainImage = this.productMain.$('img');
    this.thumbnailImages = this.productMain.$$('button:has(img) img');

    this.productTitle = this.productMain.$('h1');
    this.productPrice = this.productMain.$('[class*="price"]');
    this.productDescription = this.productMain.$('.prose, [class*="description"]');
    this.productSku = this.productMain.$('p*=SKU:');

    this.variantGroup = this.productMain.$('[role="radiogroup"]');
    this.variantOptions = this.variantGroup.$$('[role="radio"]');
    this.variantOption = this.variantOptions[0];

    this.quantityInput = this.productMain.$('input[type="number"]');
    this.quantityDecrement = this.productMain.$('button[aria-label*="decrement"]');
    this.quantityIncrement = this.productMain.$('button[aria-label*="increment"]');
    this.addToCartButton = this.productMain.$('button*=Add to cart, button*=Add to basket');
    this.buyNowButton = this.productMain.$('button*=Buy now');

    this.outOfStockLabel = this.productMain.$('span*=Out of stock');
    this.inStockLabel = this.productMain.$('span*=In stock');

    this.headerCartButton = $('header button*=Shopping Cart, header a*=Shopping Cart');
  }

  /** Open a product by slug. */
  async openProduct(slug: string): Promise<void> {
    await this.goto(`/product/${slug}`);
    await this.assertLoaded();
  }

  /**
   * Wait for product content. The variant price only appears after
   * a variant is selected — but the H1 always renders first.
   */
  async assertLoaded(): Promise<void> {
    await expect(this.productTitle).toBeDisplayed({ wait: 30_000 });
    // The main image sometimes streams in later — give it a beat.
    await browser.waitUntil(
      async () => await this.mainImage.isDisplayed().catch(() => false),
      { timeout: 30_000, timeoutMsg: 'Product main image never became visible' },
    );
  }

  /** Get the visible product title. */
  async getTitle(): Promise<string> {
    return (await this.productTitle.getText()).trim();
  }

  /** Get the visible product price as a number (strips $ and thousands separators). */
  async getPrice(): Promise<number> {
    const text = (await this.productPrice.getText()).trim();
    return Number(text.replace(/[^0-9.]/g, ''));
  }

  /** Set the quantity. Falls back to clearing+typing if no <input type="number">. */
  async setQuantity(qty: number): Promise<void> {
    if (await this.quantityInput.isDisplayed().catch(() => false)) {
      await this.quantityInput.setValue(String(qty));
    }
  }

  /**
   * Click the Add to cart button. The Vendure demo adds one unit per
   * click and has no product quantity input — so we loop to reach the
   * requested quantity, and we read the cart-count button after each
   * click to make sure the increment actually landed.
   */
  async addToCart(qty = 1): Promise<void> {
    await this.selectFirstVariant();
    const cartButton = this.headerCartButton;
    if (!(await cartButton.isDisplayed().catch(() => false))) {
      // No cart indicator — just click once.
      await this.addToCartButton.click();
      return;
    }
    const previousCount = Number(((await cartButton.getText()).match(/\d+/) ?? ['0'])[0]);
    for (let added = 1; added <= qty; added++) {
      await this.addToCartButton.click();
      await browser.waitUntil(
        async () => {
          const t = (await cartButton.getText()).trim();
          const n = Number(((t.match(/\d+/) ?? ['0'])[0]));
          return n === previousCount + added;
        },
        { timeout: 15_000, timeoutMsg: `Cart count did not advance to ${previousCount + added}` },
      );
    }
  }

  /**
   * Choose an option in every unselected variant group. The radio
   * itself is visually hidden on mobile — its label is the clickable tile.
   */
  async selectFirstVariant(): Promise<void> {
    await this.assertLoaded();
    const groups = await this.productMain.$$('[role="radiogroup"]');
    for (const group of groups) {
      const alreadySelected = await group.$$('[role="radio"][aria-checked="true"]');
      if ((await alreadySelected.length) > 0) continue;
      const labels = await group.$$('label');
      if ((await labels.length) > 0) {
        await labels[0].click();
      } else {
        // Fallback: click the first radio in the group.
        const radios = await group.$$('[role="radio"]');
        if ((await radios.length) > 0) await radios[0].click();
      }
      await browser.waitUntil(
        async () => {
          const els = await group.$$('[role="radio"][aria-checked="true"]');
          return (await els.length) > 0;
        },
        { timeout: 10_000, timeoutMsg: 'First variant in group was not selected' },
      );
    }
  }
}

export default ProductDetailPage;