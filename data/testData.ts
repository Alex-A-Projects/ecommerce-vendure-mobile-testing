/**
 * Vendure test data — public demo credentials, seed products, and
 * reusable builders for the mobile web tests.
 *
 * All product slugs and collection slugs below are verified against
 * the live public demo at https://demo.vendure.io/.
 *
 * The Remix Storefront exposes the demo under a locale prefix (`/en/`),
 * so all navigation paths in the page objects route through `/en/`.
 */

/* -----------------------------------------------------------------------
 * Public demo endpoints — the framework targets the storefront only.
 * --------------------------------------------------------------------- */
export const VendureEndpoints = {
  storefront: 'https://storefront.demo.vendure.io',
} as const;

/* -----------------------------------------------------------------------
 * Seeded customer from the Vendure demo dataset (test@vendure.io / test).
 *
 *   Note: the first/last name on this account varies as the demo is
 *   reset, so the account tests only assert on the email address.
 * --------------------------------------------------------------------- */
export const SeededCustomer = {
  emailAddress: 'test@vendure.io',
  password: 'test',
  firstName: 'Rio',
  lastName: 'Test',
} as const;

/* -----------------------------------------------------------------------
 * Known seed products (from the public Vendure demo seed)
 * --------------------------------------------------------------------- */
export const SeedProducts = {
  /** Cheap entry-level laptop (id=1) — used for cart combinatorics. */
  laptop: { slug: 'laptop', nameContains: 'Laptop' },
  /** A 32" monitor used in cart combinatorics. */
  monitor: { slug: '32-inch-monitor', nameContains: '32-Inch Monitor' },
  /** A road bike used for highest-price assertions. */
  roadBike: { slug: 'road-bike', nameContains: 'Road Bike' },
  /** A football used for cart tests. */
  football: { slug: 'football', nameContains: 'Football' },
  /** A wooden stool used in cart combinatorics. */
  woodenStool: { slug: 'wooden-stool', nameContains: 'Wooden Stool' },
  /** A modern cafe chair. */
  cafeChair: { slug: 'modern-cafe-chair', nameContains: 'Modern Cafe Chair' },
} as const;

/* -----------------------------------------------------------------------
 * Known seed collections (public demo)
 * --------------------------------------------------------------------- */
export const SeedCollections = {
  all: { slug: '__all__', nameContains: 'All' },
  electronics: { slug: 'electronics', nameContains: 'Electronics' },
  computers: { slug: 'computers', nameContains: 'Computers' },
  furniture: { slug: 'furniture', nameContains: 'Furniture' },
  equipment: { slug: 'equipment', nameContains: 'Equipment' },
  cameraPhoto: { slug: 'camera-photo', nameContains: 'Camera' },
  homeGarden: { slug: 'home-garden', nameContains: 'Home & Garden' },
  plants: { slug: 'plants', nameContains: 'Plants' },
  footwear: { slug: 'footwear', nameContains: 'Footwear' },
  sportsOutdoor: { slug: 'sports-outdoor', nameContains: 'Sports' },
} as const;

/* -----------------------------------------------------------------------
 * Known search terms
 * --------------------------------------------------------------------- */
export const SeedSearchTerms = {
  noResults: 'xyzzqq__no_such_product',
  broad: 'bike',
  exactMatch: 'laptop',
  multiWord: 'road bike',
  plural: 'bikes',
  monitor: 'monitor',
} as const;

/* -----------------------------------------------------------------------
 * Test billing / shipping address
 * --------------------------------------------------------------------- */
export const TestAddress = {
  fullName: 'Alex QA',
  street: '123 Test Street',
  city: 'Testville',
  province: 'Testshire',
  postalCode: 'TE1 1ST',
  country: 'United Kingdom',
  phone: '+44 1234 567890',
} as const;

/* -----------------------------------------------------------------------
 * Locale — the Vendure Remix Storefront is mounted under `/en/`.
 *
 *   Every page object prefixes routes with this so the same code works
 *   against the production demo and any local clone with a different
 *   locale prefix.
 * --------------------------------------------------------------------- */
export const StorefrontLocale = 'en' as const;

/* -----------------------------------------------------------------------
 * Platform under test (set in wdio.ios.conf.ts and wdio.android.conf.ts).
 * --------------------------------------------------------------------- */
export const Platform = {
  isIOS: process.env.SPECIFIC_PLATFORM === 'ios',
  isAndroid: process.env.SPECIFIC_PLATFORM === 'android',
  current: (process.env.SPECIFIC_PLATFORM ?? 'unknown').toLowerCase(),
} as const;