import { browser } from '@wdio/globals';
import type { Options } from '@wdio/types';
import AllureReporter from '@wdio/allure-reporter';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

/**
 * The full WDIO config type — `Testrunner` does not include `capabilities`
 * (those live on the `WithRequestedTestrunnerCapabilities` interface),
 * so we compose them here.
 */
export type WdioConfig = Options.Testrunner & { capabilities?: unknown };

/**
 * WebdriverIO shared base configuration.
 *
 * This file is the single source of truth for everything that does NOT
 * change between iOS Safari and Android Chrome:
 *
 *   - test runner (Mocha), timeouts, retry behaviour
 *   - reporters (Spec + Allure)
 *   - screenshots on failure
 *   - the Vendure Remix Storefront URL
 *   - the test file glob
 *   - hooks (before/after, beforeEach/afterEach)
 *
 * Platform-specific capabilities live in wdio.ios.conf.ts and
 * wdio.android.conf.ts, which both `merge(...)` this config.
 *
 * Override the SPECIFIC_PLATFORM env var to print the platform under
 * test on the console (used by the README's run instructions).
 */
export const config: WdioConfig = {
  // The shared test specs — same file runs on iOS and Android.
  specs: ['./tests/**/*.spec.ts'],
  exclude: [],

  // Mocha settings.
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 120_000,
    // We rely on WebdriverIO retries, not Mocha retries.
    retries: 0,
  },

  // The maximum number of parallel workers. Mobile-web sessions are heavy,
  // so the default of 1 keeps the simulator/emulator stable.
  maxInstances: 1,

  // WDIO-level retries. CI: 2, local: 0 (configurable via env).
  specFileRetries: process.env.CI ? 2 : 0,
  specFileRetriesDelay: 5,
  specFileRetriesDeferred: false,

  // Bail out of the whole run on the first failure (off by default;
  // turn on with `WDIO_BAIL=1` when debugging).
  bail: process.env.WDIO_BAIL === '1' ? 1 : 0,

  // Reporters: human-readable console output + Allure XML for the
  // report portal. Both reporters log to ./allure-results/.
  reporters: [
    ['spec', {
      showRealTimings: true,
      coloredStdout: true,
    }],
    ['allure', {
      outputDir: 'allure-results',
      useCucumberStepReporter: false,
      disableWebdriverStepsReporting: false,
      disableMochaHooksReporting: false,
      addConsoleLogs: true,
    }],
  ],

  // Sane defaults for both mobile browsers.
  waitforTimeout: 15_000,
  waitforInterval: 500,
  connectionRetryTimeout: 60_000,
  connectionRetryCount: 2,

  // Run before each spec file (so before each `describe`).
  before: async () => {
    // Print the platform name once at suite start. The platform-specific
    // config sets this via process.env so we can label screenshots and
    // Allure reports with iOS vs Android.
    const platform = (process.env.SPECIFIC_PLATFORM ?? 'unknown').toUpperCase();
    console.log(`\n[wdio] Starting ${platform} mobile web suite`);

    // Pre-create the artifacts directory so screenshot capture never races.
    mkdirSync(join(process.cwd(), 'screenshots'), { recursive: true });
  },

  // Session-level hook — runs once per WebdriverIO worker.
  onPrepare: () => {
    mkdirSync(join(process.cwd(), 'allure-results'), { recursive: true });
    mkdirSync(join(process.cwd(), 'screenshots'), { recursive: true });
  },

  // Run before each test — record the platform under test into the
  // Allure report so the report can filter iOS vs Android cleanly.
  beforeTest: async (test) => {
    const platform = (process.env.SPECIFIC_PLATFORM ?? 'unknown').toUpperCase();
    AllureReporter.addFeature(platform);
    AllureReporter.addArgument('platform', platform);
    AllureReporter.addArgument('deviceName', process.env.SPECIFIC_DEVICE ?? 'unknown');
    AllureReporter.addArgument('platformVersion', process.env.SPECIFIC_OS_VERSION ?? 'unknown');
    AllureReporter.addTestId(`${platform}-${test.parent ?? ''}-${test.title}`.replace(/\s+/g, '-'));
  },

  // After every test, attach the screenshot we already took in the
  // afterEach hook so Allure shows it inline.
  afterTest: async (test, _context, { error }) => {
    if (!error) return;

    const platform = (process.env.SPECIFIC_PLATFORM ?? 'unknown').toUpperCase();
    const safeTitle = test.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    const filename = join(
      'screenshots',
      `${platform}-${safeTitle}-${Date.now()}.png`,
    );
    try {
      await browser.saveScreenshot(filename);
      AllureReporter.addAttachment(
        `Failure screenshot (${platform})`,
        Buffer.from(await browser.takeScreenshot(), 'base64'),
        'image/png',
      );
    } catch {
      // Don't mask the real failure with a screenshot failure.
      console.warn(`[wdio] could not capture screenshot at ${filename}`);
    }
  },

  onComplete: () => {
    console.log('[wdio] Suite complete.');
  },
};

export default config;