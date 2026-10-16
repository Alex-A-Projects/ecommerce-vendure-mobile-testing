import deepmerge from 'deepmerge';
import shared, { type WdioConfig } from './wdio.shared.conf.ts';
import type { Options } from '@wdio/types';

/**
 * WebdriverIO iOS configuration.
 *
 * Drives the Vendure Remix Storefront in **mobile Safari** via Appium 2's
 * XCUITest driver against an iPhone 17-series simulator. The matching
 * device, OS version, and bundle ID are tunable via environment variables
 * so the same config can target any Xcode-installed simulator.
 *
 * Pre-flight checklist (run these once before this config):
 *
 *   1. `xcode-select -p` returns an Xcode developer directory.
 *   2. `xcrun simctl list devices iPhone | grep -i "iphone 17"` shows at
 *      least one iPhone 17 device.
 *   3. `npm run appium:install-ios` has installed the xcuitest driver.
 *   4. An iOS simulator is booted (`open -a Simulator`).
 *
 * Environment overrides:
 *   IOS_DEVICE_NAME     default 'iPhone 17 Pro'
 *   IOS_PLATFORM_VERSION default '19.0'  (iOS shipped with iPhone 17)
 *   IOS_UDID            optional — pin to a specific simulator UDID
 *   WDIO_HEADED         when '1', keeps the Simulator window visible
 */
process.env.SPECIFIC_PLATFORM = 'ios';
process.env.SPECIFIC_DEVICE = process.env.IOS_DEVICE_NAME ?? 'iPhone 17 Pro';
process.env.SPECIFIC_OS_VERSION = process.env.IOS_PLATFORM_VERSION ?? '19.0';

const baseCapability = {
  platformName: 'iOS',
  'appium:automationName': 'XCUITest',
  'appium:deviceName': process.env.IOS_DEVICE_NAME ?? 'iPhone 17 Pro',
  'appium:platformVersion': process.env.IOS_PLATFORM_VERSION ?? '19.0',
  // Safari handles the web session — we do NOT install a Vendure app.
  'appium:bundleId': 'com.apple.mobilesafari',
  'appium:noReset': true,
  'appium:language': 'en',
  'appium:locale': 'en_US',
  'appium:newCommandTimeout': 240,
  // Safari runs Web Inspector so Appium can attach to it.
  'appium:startIWDP': true,
  'appium:autoWebview': false,
  // Defensive timeouts for a slow simulator.
  'appium:wdaLaunchTimeout': 120_000,
  'appium:wdaConnectionTimeout': 120_000,
  'appium:webkitResponseTimeout': 30_000,
  // Keep the device awake while the suite runs.
  'appium:keepKeyChords': true,
  ...(process.env.IOS_UDID
    ? { 'appium:udid': process.env.IOS_UDID }
    : {}),
};

const iOSConfig: WdioConfig = {
  hostname: '127.0.0.1',
  port: 4723,
  path: '/',
  // Auto-start an Appium server via @wdio/appium-service. The CLI's
  // `wdio` runner talks to this server directly.
  services: [
    [
      'appium',
      {
        command: 'appium',
        args: {
          // Bind to localhost only; the WDA port for iOS.
          address: '127.0.0.1',
          port: 4723,
          // Sensible log level — bump to 'debug' when triaging.
          logLevel: process.env.APPIUM_LOG_LEVEL ?? 'warn',
          relaxedSecurity: true,
          // Use the system Appium install (drivers installed via
          // `appium driver install xcuitest`).
          useDrivers: 'xcuitest',
        },
      },
    ],
  ],

  // The single capability that drives the iPhone 17 Safari session.
  capabilities: [baseCapability],

  // WebdriverIO log level — silent for tests, warn if debugging.
  logLevel: (process.env.WDIO_LOG_LEVEL as 'warn' | 'error' | 'info' | 'debug' | 'trace') ?? 'warn',
};

export const config = deepmerge(shared, iOSConfig, {
  // Hooks and reporters are arrays — append, don't replace.
  arrayMerge: (_target, source) => source,
}) as WdioConfig;
export default config;