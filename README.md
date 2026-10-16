# Vendure Mobile Web Testing — WebdriverIO + Appium 2

A **mobile web automation framework** that drives the public [Vendure Remix Storefront](https://storefront.demo.vendure.io/) on a real iOS Simulator and Android Emulator — no native-app code, just Safari and Chrome running inside XCUITest and UiAutomator2.

The project is the mobile-web companion to the desktop [Playwright + TypeScript suite](../ecommerce-vendure-playwright-typescript). It uses the same Vendure seed data, the same user journeys, and a near-identical Page Object Model — adapted for Appium 2's element selectors, mobile Safari / Chrome quirks, and touch-driven interactions.

```
TypeScript + WebdriverIO 9 + Appium 2 + Mocha + expect-webdriverio + Allure
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                                                       │
        iOS 17/18/19 Simulator                                  Samsung Galaxy Emulator
        Safari  via  XCUITest                                   Chrome via UiAutomator2
        wdio.ios.conf.ts                                        wdio.android.conf.ts
              │                                                       │
              └───────────────── shared specs ────────────────────────┘
                                       │
                              tests/*.spec.ts
```

## Why a separate mobile-web framework?

The Playwright suite covers desktop Chrome only. Mobile-web testing has different failure modes:

- **iOS Safari** re-renders the storefront with its own cookie/storage semantics.
- **Chrome on Android** treats the responsive layout as a touch interface — buttons render at different sizes, the navigation collapses into a hamburger.
- **Appium 2** exposes the browser through XCUITest / UiAutomator2, so every locator must be touch-safe (no `hover`, no `page.evaluate`, no shadow DOM piercing).
- **Cookies, local storage, and HTTP semantics** differ on mobile-web, so the same flow can pass on desktop and fail on iOS.

This project exercises the Vendure storefront under both of those conditions with a single test suite.

## Stack

| Layer | Technology | Version | Purpose |
| ----- | ---------- | ------- | ------- |
| Language | TypeScript | 5.9 | Test code with `strict: true`, `noImplicitAny`, and explicit return types |
| Runtime | Node.js | 20.18+ | Runtime; required by WebdriverIO 9 / Appium 2 |
| Package manager | npm | 10.x | Dependency management and script runner |
| Test runner | WebdriverIO | 9.32 | Test orchestration, `$` / `$$` selectors, deep-merge of platform configs |
| Framework adapter | @wdio/mocha-framework | 9.31 | BDD `describe` / `it` / `beforeEach` hooks |
| Element matchers | expect-webdriverio | 6.1 | `expect(element).toBeDisplayed()`, `toHaveText()`, `toBeEnabled()` |
| Server | Appium | 2.19 | Driver orchestration against iOS Simulator and Android Emulator |
| iOS driver | XCUITest | latest | Drives mobile Safari on the iPhone 17-series simulator |
| Android driver | UiAutomator2 | latest | Drives Chrome on the Samsung Galaxy emulator |
| Service | @wdio/appium-service | 9.32 | Starts an Appium 2 server per run, bound to localhost |
| Reporter | @wdio/spec-reporter | 9.31 | Human-readable console output |
| Reporter | @wdio/allure-reporter | 9.31 | Per-test XML for the Allure portal (`allure-results/`) |
| Report renderer | allure-commandline | 2.46 | Static-site renderer for `allure-report/` |
| Config helper | deepmerge | 4.3 | Merges `wdio.shared.conf.ts` into each platform config |

## Targets

| Layer | Endpoint | Auth |
| ----- | -------- | ---- |
| Storefront (mobile web) | `https://storefront.demo.vendure.io` | public |
| iOS Safari | `com.apple.mobilesafari` via XCUITest | n/a |
| Android Chrome | `com.android.chrome` via UiAutomator2 | n/a |

The seed data (products, collections, customer) is identical to the desktop suite — see `data/testData.ts`.

## What's in here

```
.
├── data/
│   └── testData.ts                # VendureEndpoints, SeedProducts, SeedCollections, SeededCustomer
│
├── helpers/
│   ├── formatters.ts              # parsePrice / formatUSD / uniqueEmail / sleep
│   ├── wait.ts                    # waitForUrl, expect re-exports
│   └── consoleErrors.ts           # client-side error tracking helpers
│
├── pageobjects/
│   ├── BasePage.ts                # global header / footer / navigation
│   ├── HomePage.ts                # hero + featured product grid
│   ├── ProductListPage.ts         # collection / category / search results
│   ├── ProductDetailPage.ts       # single product + variant picker
│   ├── CartPage.ts                # line items, totals, remove
│   ├── CheckoutPage.ts            # contact / address / delivery / payment / review
│   ├── AccountLoginPage.ts        # /sign-in form
│   ├── AccountRegisterPage.ts     # /register form
│   ├── AccountPage.ts             # post-login dashboard
│   └── SearchPage.ts              # /search?q=...
│
├── fixtures/
│   └── pomFixtures.ts             # `poms()` factory for spec bootstrapping
│
├── tests/
│   ├── home.spec.ts               # hero, featured cards, navigation
│   ├── header-footer.spec.ts      # header/footer on every page
│   ├── product-listing.spec.ts    # collection browse + card content
│   ├── product-detail.spec.ts     # title / price / variants / add-to-cart
│   ├── cart.spec.ts               # add / remove / totals / checkout
│   ├── checkout.spec.ts           # accordion walk-through
│   ├── search.spec.ts             # header form + /search?q= deep links
│   ├── account-login.spec.ts      # /sign-in form
│   ├── account-register.spec.ts   # /register form
│   ├── account.spec.ts            # profile / orders / sign-in redirects
│   └── navigation.spec.ts         # cross-page navigation
│
├── wdio.shared.conf.ts            # Mocha, retries, reporters, screenshots on failure
├── wdio.ios.conf.ts               # iPhone 17-series iOS Simulator, Safari, XCUITest
├── wdio.android.conf.ts           # Samsung Galaxy emulator, Chrome, UiAutomator2
├── tsconfig.json
└── package.json
```

## Pre-flight checklist

The framework does **not** install Xcode or Android Studio for you. Before the first run, ensure the host machine is set up correctly.

### macOS host

```bash
# 1. Xcode command-line tools
xcode-select -p            # returns a developer directory
xcodebuild -version        # Xcode 16+ ships with iPhone 17 simulators

# 2. iPhone 17 simulator present
xcrun simctl list devices iPhone | grep -i "iphone 17"

# 3. Android Studio + an AVD based on a Samsung Galaxy profile
adb devices                 # emulator-5554 should appear once the AVD boots
emulator -list-avds         # list existing AVDs
```

### Appium drivers

The Appium 2 server and the XCUITest / UiAutomator2 drivers are installed by **Appium itself**, not via `npm install`. The framework ships an `npm run` helper for each:

```bash
# Appium 2 (system-wide) — required before anything else works
npm install -g appium

# XCUITest driver (iOS)
npm run appium:install-ios
# equivalent to:  npx appium driver install xcuitest

# UiAutomator2 driver (Android)
npm run appium:install-android
# equivalent to:  npx appium driver install uiautomator2

# Optional sanity check — flags missing host-side deps
npm run appium:doctor
```

### Project dependencies

```bash
npm install
```

## Quick start

```bash
# 1. Boot a simulator (iOS)
open -a Simulator                            # GUI Simulator app
xcrun simctl boot "iPhone 17 Pro"            # or your preferred device

# Or boot an Android AVD
emulator -avd "Galaxy_S26_API_16" &          # or use Android Studio's AVD Manager

# 2. Install the Appium drivers (one-time)
npm run appium:install-ios
npm run appium:install-android

# 3. Run the suite on iOS
npm run test:ios
# WebdriverIO starts an Appium server on :4723, drives Safari, and writes
# screenshots + Allure XML into ./screenshots/ and ./allure-results/.

# 4. Run the suite on Android
npm run test:android
# Same flow, server on :4724, Chrome via UiAutomator2.

# 5. Run both back-to-back
npm run test:both
```

## npm scripts

| Script | What it does |
| ------ | ------------ |
| `npm run test:ios` | WebdriverIO runs the shared specs against the iOS Simulator |
| `npm run test:android` | WebdriverIO runs the shared specs against the Android Emulator |
| `npm run test:both` | Convenience wrapper — runs iOS then Android in sequence |
| `npm run test:ios:headed` | Same as `test:ios` with `WDIO_HEADED=1` (Simulator window stays visible) |
| `npm run test:android:headed` | Same as `test:android` with `WDIO_HEADED=1` |
| `npm run allure:generate` | Renders `allure-results/` → static `allure-report/` |
| `npm run allure:open` | Opens the static report in your default browser |
| `npm run allure:serve` | Hosts the report on a local server with live updates |
| `npm run appium:install-ios` | `appium driver install xcuitest` |
| `npm run appium:install-android` | `appium driver install uiautomator2` |
| `npm run appium:doctor` | Diagnostic — flags missing host-side deps |
| `npm run clean` | Remove `allure-results/`, `screenshots/`, and WDIO logs |

## Configuration overrides

Both configs read environment variables that override the defaults — useful for swapping to a different device without editing the file.

| Variable | Default | Applies to |
| -------- | ------- | ---------- |
| `IOS_DEVICE_NAME` | `iPhone 17 Pro` | iOS |
| `IOS_PLATFORM_VERSION` | `19.0` | iOS |
| `IOS_UDID` | (none — pick any booted sim) | iOS |
| `ANDROID_DEVICE_NAME` | `Samsung Galaxy S26` | Android |
| `ANDROID_PLATFORM_VERSION` | `16` | Android |
| `ANDROID_UDID` | (none — first connected device) | Android |
| `ANDROID_APP_PACKAGE` | `com.android.chrome` | Android |
| `ANDROID_APP_ACTIVITY` | `com.google.android.apps.chrome.Main` | Android |
| `APPIUM_LOG_LEVEL` | `warn` | Both |
| `WDIO_LOG_LEVEL` | `warn` | Both |
| `WDIO_HEADED` | `0` | Both — keep emulator/sim window visible |
| `WDIO_BAIL` | `0` | Both — stop on first failure |
| `RUN_DEMO_ORDER_TEST` | `0` | Checkout — opt-in to actually placing an order |

Examples:

```bash
# Pin iOS to a specific simulator UDID
IOS_UDID=12345678-1234-1234-1234-123456789012 npm run test:ios

# Run Android against a Pixel-style AVD
ANDROID_DEVICE_NAME="Pixel 9" ANDROID_PLATFORM_VERSION="16" npm run test:android

# Headed iOS — Simulator window stays open
WDIO_HEADED=1 npm run test:ios
```

## Page Object Model

Every page in the storefront has a dedicated POM under `pageobjects/`. The `BasePage` exposes the global header (logo, collection nav, search box, cart, account) and footer (about, contact, privacy, terms) so child pages just add page-specific locators and actions.

Selectors are written as WebdriverIO CSS with `*=value` substring matches and `[attr*="value"]` substring attribute matches. They are tuned to the current Vendure Remix Storefront layout but degrade to "first match containing X" so the same code works against minor markup changes.

```ts
import { expect } from 'expect-webdriverio';
import { $ } from '@wdio/globals';
import { poms } from './fixtures/pomFixtures';

describe('Custom flow', () => {
  const ctx = poms();

  beforeEach(async () => {
    await ctx.homePage.open();
  });

  it('adds the seed laptop to the cart from the home page', async () => {
    await ctx.homePage.clickFirstFeaturedProduct();
    await ctx.productDetailPage.addToCart(1);
    await expect(ctx.productDetailPage.headerCartButton).toHaveText(/1/);
  });
});
```

## Mobile-web specifics

- **Locator strategies** — Playwright's `getByRole` / `getByText` are unavailable. WebdriverIO uses CSS with `*=` substring matching. Selectors are tuned to be resilient to minor markup churn.
- **No `hover`** — Mobile web has no hover. Anywhere a desktop test would `hover()` we use `click()` on the same target.
- **No `page.evaluate`** — W3C WebDriver does not allow arbitrary JS evaluation. Anything that needs DOM access goes through element commands or Allure attachments.
- **Cart indicator** — The Vendure header has a "Shopping Cart" button whose visible text includes the count (e.g. `1\nShopping Cart`). We assert against that text after every add-to-cart.
- **Empty cart loop** — Every cart test starts by emptying the cart, because the mobile Safari session shares cookies with desktop in some setups. The `CartPage.beforeEach` walks the cart to zero items before the test runs.
- **Self-skip** — Tests throw `__SKIP__:<reason>` to opt out without failing the suite when the storefront doesn't expose a route on the current build.

## Test counts

| Layer | Test files | Tests |
| ----- | ---------- | ----- |
| UI / mobile web | 11 | ~95 |
| **Total** | **11** | **~95** |

Tests self-skip when the storefront returns a 404 on a route, doesn't render a particular element on the current layout, or the demo is rate-limiting. The actual count depends on the current state of the demo and on whether the simulated browser had time to render.

## Reports

- `screenshots/<platform>-<test>-<timestamp>.png` — captured on every failure and attached to Allure.
- `allure-results/` — raw XML written by `@wdio/allure-reporter`.
- `allure-report/` — rendered static site (after `npm run allure:generate`).

```bash
npm run test:ios
npm run allure:generate          # renders allure-results/ → allure-report/
npm run allure:open               # macOS — opens allure-report/index.html
```

## Conventions

- **Self-skipping** — Tests throw `__SKIP__:<reason>` when the demo is rate-limited, when a DOM element is absent on the current layout, or when the build doesn't expose the route. Every test reports either `passed` or `skipped`; nothing should crash the suite.
- **No shared state between tests** — Every test empties its cart, logs itself out, and starts from `/`.
- **Type-safe** — Page object methods return `ChainablePromiseElement` / `Promise<number>` etc. The `WdioConfig` interface ensures capabilities survive `deepmerge`.
- **POM over inline locators** — Inline `$('selector')` is used sparingly (e.g., `tests/navigation.spec.ts` for the global nav link check). Every flow routes through a POM.
- **Selectors degrade gracefully** — When a selector can't find a single match, the test self-skips with a clear reason rather than failing.

## Known limitations

- The Vendure demo is **public and rate-limited**. Multiple back-to-back runs can return 429; tests self-skip on rate-limit hits.
- The demo's `/account/*` UI is sparse — most tests in `account.spec.ts`, `account-login.spec.ts`, and `account-register.spec.ts` self-skip when the route 404s.
- The framework is configured for a single worker (`maxInstances: 1`). Mobile simulators are heavy and don't parallelise well. To run on multiple devices, point multiple sessions at different UDIDs via `IOS_UDID` / `ANDROID_UDID`.

## License

Internal QA tooling — no public license.