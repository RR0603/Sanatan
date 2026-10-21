// Launch configuration — the only file you need to edit to go live. See LAUNCH.md.
window.LS = window.LS || {};

LS.CONFIG = {
  appId: 'com.livingsanatan.antariksha',
  version: '1.1.0',

  pro: {
    // RevenueCat (https://app.revenuecat.com) handles App Store + Google Play purchases.
    // Paste the *public* SDK keys from RevenueCat → Project → API keys (safe to ship in the app).
    revenueCat: {
      ios: '',      // starts with "appl_"
      android: '',  // starts with "goog_"
    },
    entitlement: 'pro',                       // RevenueCat entitlement identifier
    productId: 'antariksha_pro_lifetime',     // same product id in App Store Connect and Play Console

    // Prices shown on the website. In the apps the store's own localised price is shown instead.
    webPrice: { india: '₹11', world: '$3.33' },

    // How the website (GitHub Pages / livingsanatan.com) treats Pro features:
    //   'stores'  — show the paywall with links to the App Store / Google Play (default)
    //   'free'    — unlock everything on the web (e.g. during a beta)
    webMode: 'stores',
    // Opening the site with ?preview unlocks Pro in that browser tab only (for demos / review).
    webPreviewParam: 'preview',

    // Fill in after the apps are live.
    storeLinks: {
      ios: '',      // e.g. https://apps.apple.com/app/id0000000000
      android: '',  // e.g. https://play.google.com/store/apps/details?id=com.livingsanatan.antariksha
    },
  },

  links: {
    // Where privacy.html, terms.html and support.html are published. The apps open the legal pages from
    // here in the browser (App Store / Play require a public privacy policy URL anyway).
    web: 'https://livingsanatan.com/antariksha/',
    site: 'https://livingsanatan.com',
    privacy: 'privacy.html',
    terms: 'terms.html',
    support: 'support.html',
    email: 'support@livingsanatan.com',
  },
};
