import deepmerge from 'deepmerge';
import shared, { type WdioConfig } from './wdio.shared.conf.ts';
import type { Options } from '@wdio/types';

/**
 * WebdriverIO Android configuration.
 *
 * Drives the Vendure Remix Storefront in **mobile Chrome** via Appium 2's
 * UiAutomator2 driver against a Samsung Galaxy-series emulator. The
 * matching device, OS version, and Chrome package are tunable via
 * environment variables so the same config can target any Android Studio
 * AVD.
 *
 * Pre-flight checklist (run these once before this config):
 *
 *   1. `adb devices` shows the target emulator as `device`.
 *   2. `npm run appium:install-android` has installed the uiautomator2 driver.
 *   3. An AVD based on a Samsung Galaxy profile is created.
 *   4. Chrome is installed on the AVD (the default SDK image ships with it).
 *
 * Environment overrides:
 *   ANDROID_DEVICE_NAME     default 'Samsung Galaxy S26'
 *   ANDROID_PLATFORM_VERSION default '16'
 *   ANDROID_UDID            optional — pin to a specific emulator UDID
 *   ANDROID_APP_PACKAGE     default 'com.android.chrome'
 *   WDIO_HEADED             when '1', keeps the emulator window visible
 */
process.env.SPECIFIC_PLATFORM = 'android';
process.env.SPECIFIC_DEVICE = process.env.ANDROID_DEVICE_NAME ?? 'Samsung Galaxy S26';
process.env.SPECIFIC_OS_VERSION = process.env.ANDROID_PLATFORM_VERSION ?? '16';

const baseCapability = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': process.env.ANDROID_DEVICE_NAME ?? 'Samsung Galaxy S26',
  'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION ?? '16',
  // Chrome is the browser; Appium will start it via the activity below.
  'appium:appPackage': process.env.ANDROID_APP_PACKAGE ?? 'com.android.chrome',
  'appium:appActivity':
    process.env.ANDROID_APP_ACTIVITY ?? 'com.google.android.apps.chrome.Main',
  // Don't reset the emulator on each session — we want Chrome's cookies
  // and history to persist between runs.
  'appium:noReset': true,
  'appium:language': 'en',
  'appium:locale': 'US',
  'appium:newCommandTimeout': 240,
  // Auto-grant Chrome's runtime permissions so the web session can
  // render notifications, location prompts, etc., without UI dialogs.
  'appium:autoGrantPermissions': true,
  // Tell UiAutomator2 to skip its first-install dance — saves ~5s per run.
  'appium:skipServerInstallation': true,
  // Allow the hostnames we test against without TLS errors.
  'appium:chromedriverArgs': {
    'allow-insecure-localhost': false,
    'disable-dev-shm-usage': true,
    'no-sandbox': true,
  },
  ...(process.env.ANDROID_UDID
    ? { 'appium:udid': process.env.ANDROID_UDID }
    : {}),
};

const androidConfig: WdioConfig = {
  hostname: '127.0.0.1',
  port: 4724,
  path: '/',
  services: [
    [
      'appium',
      {
        command: 'appium',
        args: {
          address: '127.0.0.1',
          port: 4724,
          logLevel: process.env.APPIUM_LOG_LEVEL ?? 'warn',
          relaxedSecurity: true,
          useDrivers: 'uiautomator2',
        },
      },
    ],
  ],

  capabilities: [baseCapability],

  logLevel: (process.env.WDIO_LOG_LEVEL as 'warn' | 'error' | 'info' | 'debug' | 'trace') ?? 'warn',
};

export const config = deepmerge(shared, androidConfig, {
  arrayMerge: (_target, source) => source,
}) as WdioConfig;
export default config;