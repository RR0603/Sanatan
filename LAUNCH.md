# Launch map: Antariksha on the App Store and Google Play

This is the full route from this repository to a live app in both stores, in the order to do it.
Everything technical is already set up: the native projects, the in-app purchase code, icons and splash screens, store screenshots, legal pages and the build pipelines.
Most of what is left is **accounts, forms and pasting keys**. None of it needs a Mac.

| | |
| --- | --- |
| App name | Antariksha: Vedic Sky Map |
| Bundle ID / package name | `com.livingsanatan.antariksha` (fixed forever once published) |
| In-app product | `antariksha_pro_lifetime`, non-consumable (one-time, never expires) |
| Pro entitlement (RevenueCat) | `pro` |
| Free | Sky map, AR camera, sensor tracking, Today (Rahu Kaal, Choghadiya), festival calendar and reminders, Tonight and the finder arrow, Kundali Milan, Panchang, Bhachakra wheel, transit Kundali (D1), all grahas, time travel, both designs, Hindi and English |
| Pro | Janma Kundali (birth chart), birth-sky view, Vimshottari Dasha, Navamsa D9, saved family profiles |
| Store copy | [`STORE_LISTING.md`](STORE_LISTING.md) |
| Screenshots | [`store/`](store) (regenerate with `npm run store-shots`) |
| Ready-to-upload kit | [`fastlane/`](fastlane): every listing field, icon, feature graphic and screenshot in store layout. See its README for which file goes in which box. Regenerate with `npm run store-kit`. |

Time to plan for:

- **Apple:** account approval takes 1–2 days (individual) or 1–2 weeks (organisation, which needs a D-U-N-S number), then about 1–3 days of review.
- **Google, personal account:** 14 days of closed testing are mandatory before you can publish.
- **Google, organisation account:** about 1–7 days of review.

---

## Launch-day plan (publishing as an individual, no company yet)

You do **not** need a registered company. Both stores accept an individual developer with a government ID, a PAN and an Indian bank account. You can move the apps to a company account later; both stores support app transfers.

**Payments in India: use the stores' own billing (already built in).**

- Inside the iOS and Android apps, unlocking features must be paid through Apple In-App Purchase and Google Play Billing. Linking to Razorpay, UPI or any outside payment for Pro inside the apps is grounds for rejection (Apple 3.1.1; Play Payments policy).
- The app already uses both stores through **RevenueCat**, which is free up to $2.5k per month.
- Buyers in India pay with whatever their store offers, including UPI, cards and net banking.
- The stores pay out to your bank account every month. They are the seller of record for the customer's purchase. Ask a CA about your own income tax and GST position.

**The order of work.** You can't launch on every channel tomorrow, so launch what can go live and start the rest:

1. **Tonight**
   1. Enrol in the **Apple Developer Program as an Individual** (B1). Apple's approval can take from a few hours to about 2 days.
   2. Create the **Google Play personal account** (A1). Identity checks take 1–3 days.
   3. Create a **RevenueCat** account (R1).
2. **Tomorrow (launch day)**
   1. Publish the **website**: copy the repository folder to `livingsanatan.com/antariksha/`. This also puts the privacy policy, terms and support pages online, which both stores require. The site works today.
      - The web paywall says "Coming soon to the App Store and Google Play" until `storeLinks` are filled in.
      - To give web visitors Pro free for launch week, set `webMode: 'free'` in `js/config.js`.
   2. Put your legal name in `terms.html`. `npm run preflight` lists anything that's still missing.
   3. As soon as each account is approved:
      - Create the app and the in-app product (B3/B6, A2/A6).
      - Paste the RevenueCat keys (R4), commit, and run the **iOS release** and **Android release** workflows.
3. **iOS**
   1. The build goes to TestFlight. Submit it for review together with the in-app purchase (B8).
   2. Review typically takes 24–48 h. With the account approved, the App Store version is realistic **2–5 days** after you enrol.
4. **Android (personal account)**
   1. Start **closed testing with 12+ testers for 14 days** (A8). Google requires this before production for new personal accounts; it cannot be skipped.
   2. Invite your community on launch day, via a Google Group or the opt-in link.
   3. Production follows after about day 15–20.

**What `npm run preflight` checks before every store build** (the release workflows refuse to build until it passes):

- The RevenueCat keys are present.
- The legal-name placeholder is gone and the support e-mail is set.
- The version number agrees across the web app, Android and iOS.
- The iOS usage descriptions and privacy manifest are in place, and export compliance is answered.
- No exact-alarm or background-location permissions are requested.
- Android cloud backup and web debugging are off.
- No secret keys ship in the app.

**App Review notes to keep in mind** (already reflected in the app and in `STORE_LISTING.md`):

- **Apple 3.1.1:** Pro is a store purchase with **Restore purchases**. The apps show only the store's localised price and never mention another platform or an outside payment.
- **Apple 4.3(b):** the listing leads with the planetarium and the Panchang (Education/Reference). Avoid "horoscope" and "predictions" in the name, subtitle and screenshots.
- **Apple 5.1.1:**
  - Each permission has a clear purpose string.
  - Location is asked for once at first launch to set the sky for your place; you can pick a city instead.
  - Camera and motion are asked for only when the user taps them, and notifications only when reminders are turned on.
  - There are no accounts and no tracking, and the privacy manifest is bundled.
- **Google Play:**
  - Target SDK 36.
  - Foreground location only.
  - No exact alarms.
  - Notifications only after the user opts in.
  - Data safety answers are in `STORE_LISTING.md`.

---

## Step 0: Decide and prepare (½ day)

1. **Who publishes: an individual or an organisation?** The seller name shown on the store is your personal name or your organisation's legal name.
   - **Organisation (recommended if Living Sanatan is a registered entity):**
     - You need a free [D-U-N-S number](https://developer.apple.com/support/D-U-N-S/), which takes up to about 2 weeks.
     - You need a website on your own domain (livingsanatan.com).
     - Google Play does **not** apply the 12-tester rule (see A8) to organisation accounts.
   - **Individual:**
     - Faster to set up.
     - Your legal name is shown publicly.
     - Google requires 12 testers for 14 days before launch.
2. **Fill in the placeholders:**
   - `terms.html`: replace `[legal name of the owner of Living Sanatan]` with the publishing person or company.
   - `js/config.js`: check that `links.email` (support@livingsanatan.com) is a real inbox that you read. Apple and Google both require a working support contact.
3. **Put the legal pages online at public URLs.** Both stores ask for a privacy-policy URL. Upload the whole site (or just `privacy.html`, `terms.html`, `support.html`, `css/` and `fonts/`) to livingsanatan.com, for example:
   - `https://livingsanatan.com/antariksha/privacy.html`
   - `https://livingsanatan.com/antariksha/terms.html`
   - `https://livingsanatan.com/antariksha/support.html`

   (The old GitHub Pages workflow was removed from this repo, so livingsanatan.com is the place.)
4. **Push this branch to `main`** (merge the pull request), so that GitHub Actions can run the release workflows from it.

---

## Step R: RevenueCat, the purchase backend for both stores (30 min)

RevenueCat validates App Store and Google Play receipts, so the app knows who has Pro. It is free up to $2,500 of monthly revenue.

1. **R1. Create an account** at [app.revenuecat.com](https://app.revenuecat.com), then create a project named **Antariksha**.
2. **R2. Add the two apps:**
   - **App Store app**, bundle ID `com.livingsanatan.antariksha`. Upload the *In-App Purchase key* from App Store Connect (Users and Access → Integrations → In-App Purchase) once your Apple account exists (step B).
   - **Play Store app**, package `com.livingsanatan.antariksha`. Add the *service account JSON* from step A7.
3. **R3. Create the entitlement and offering:**
   - Entitlements → **New** → identifier `pro`.
   - Products → add `antariksha_pro_lifetime` for both apps, after you create it in the stores (A6 and B6). Attach both products to the `pro` entitlement.
   - Offerings → the `default` offering → add a package of type **Lifetime** containing both products. Make it the *current* offering.
4. **R4. Paste the two public SDK keys** into `js/config.js` (Project settings → API keys):

   ```js
   revenueCat: {
     ios: 'appl_xxxxxxxxxxxxxxxx',
     android: 'goog_xxxxxxxxxxxxxxxx',
   },
   ```

   These are public keys and are meant to be shipped inside the app. Commit and push the change.

Until R4 is done, the apps run normally but the **Unlock** button reports that purchases are not available.

---

## Pricing: ₹11 in India, $3.33 elsewhere

| Store | India | United States / rest of world |
| --- | --- | --- |
| **Google Play** | **₹11** (Play allows any amount from ₹10) | **$3.33** (any amount in cents is allowed) |
| **Apple App Store** | The nearest Apple price point to ₹11 | **$3.29** or **$3.39** |

Why Apple's prices differ:

- Apple only sells at fixed *price points*. Below $10 they go up in steps of 10 cents and end in 9, so $3.33 itself does not exist.
- In App Store Connect, set **India** as the base country and pick the point nearest ₹11 from the dropdown (the lowest Indian points are around ₹9–₹19).
- Then open *Manage pricing → United States* and choose $3.29 or $3.39.
- Every other country follows the base price automatically, or you can override any of them.

How the price reaches the user:

- **In the apps**, the paywall always shows the store's own localised price, so whatever you set in the store is what users see.
- **On the website**, `js/config.js → webPrice` controls the text. The website does not sell anything; it sends people to the stores.

---

## Try it on an Android phone today (no accounts needed)

GitHub → **Actions** → **Android test APK** → **Run workflow**. When it finishes (about 6 minutes), open the run, download **antariksha-test-apk-N**, unzip it and send `app-debug.apk` to any Android phone (WhatsApp it to yourself or use Drive). Tap it and allow "Install unknown apps" when asked.

Everything works except buying Pro: purchases only work in builds installed from Google Play (step A5 onwards). Use this build to show friends and family, and to recruit your 12 closed-testing testers (step A8).

---

## A. Google Play

### A1. Developer account ($25 one-time)

- Sign up at [play.google.com/console/signup](https://play.google.com/console/signup) and choose **Personal** or **Organisation** (see step 0).
- Complete identity verification. This takes 1–3 days, and an organisation also needs a D-U-N-S number.
- Settings → **Payments profile**: add your bank account so you can sell in-app products. Google handles GST on Indian sales.

### A2. Create the app

- Play Console → **Create app**.
  - Name: *Antariksha: Vedic Sky Map*. Default language: English (India) or English (US).
  - Type: **App**. Pricing: **Free**. Accept the declarations.

### A3. Create your upload key (once; keep it safe forever)

On any computer with Java installed (or ask a developer):

```sh
keytool -genkeypair -v -keystore antariksha-upload.jks -alias upload \
  -keyalg RSA -keysize 2048 -validity 10000
# choose a strong password; answer the name/organisation questions
base64 -w0 antariksha-upload.jks > keystore.b64   # macOS: base64 -i antariksha-upload.jks -o keystore.b64
```

- Store `antariksha-upload.jks` and both passwords in a password manager.
  - Play App Signing holds the real signing key, so a lost upload key *can* be reset through Google support. Still, don't lose it.
- **Never commit the keystore.** `.gitignore` already blocks `*.jks`.

### A4. GitHub secrets for Android

GitHub → repo **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | contents of `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | key password (same as the keystore password if you pressed Enter) |

### A5. Build and make the first upload (manual, once)

1. GitHub → **Actions → Android release → Run workflow** (track: `internal`).
2. When it finishes (about 8 min), open the run, download the artifact `antariksha-android-N`, and unzip it to get `app-release.aab`.
3. Play Console → *Test and release → Testing → Internal testing → Create new release*:
   - When asked, accept **Play App Signing**.
   - Upload the `.aab` and name it *1.0.0*.
   - Under Testers, add your own Gmail addresses, then **Save and roll out**.
4. Install it from the opt-in link on your phone and check it: sky, sensor, camera, Panchang, Jyotish.

Google requires the first upload to be done by hand. After that, the workflow can upload on its own (see A7).

### A6. Create the in-app product

Play Console → *Monetise with Play → Products → In-app products* → **Create product**. (This only becomes available after A5, because the app bundle contains the billing permission.)

- Product ID: `antariksha_pro_lifetime`
- Name: *Antariksha Pro*
- Description: *Janma Kundali, Dasha, Navamsa D9 and family profiles*
- Price:
  1. Set the default price to **USD 3.33**.
  2. Click **Update exchange rates** so other countries are filled in.
  3. Edit **India** to **₹11**.
  4. Save, then **Activate**.

Then add the product in RevenueCat (R3).

### A7. Automatic uploads (optional, recommended)

1. Google Cloud console:
   - Create a project.
   - Enable the **Google Play Android Developer API**.
   - Create a **service account** and download its **JSON key**.
2. Play Console → **Users and permissions → Invite new user**:
   - Enter the service account's e-mail.
   - App permissions → Antariksha → *Release to testing tracks*, *Manage store presence*, *View financial data*.
   - Also tick *Manage orders and subscriptions* (RevenueCat needs it).
3. Add the JSON in two places:
   - In RevenueCat (step R2).
   - In GitHub as the secret **`PLAY_SERVICE_ACCOUNT_JSON`** (paste the whole file).

From then on, each run of **Android release** uploads the bundle to the chosen track as a *draft*. You review it in Play Console and press *Roll out*.

### A8. Closed testing: only for personal accounts (14 days)

Google requires new personal accounts to run a closed test with **at least 12 testers who stay opted in for 14 continuous days** before applying for production.

1. *Testing → Closed testing → Create track*.
2. Promote the internal release to it, or run the workflow with track `alpha`.
3. Add testers through a Google Group or an e-mail list. Family, the Living Sanatan community and WhatsApp groups all work.
4. Testers must **opt in through the link and install the app**. Ask them to open it a few times.
5. After 14 days: Dashboard → **Apply for production**, and answer the short questionnaire about the test.

Organisation accounts skip this step.

### A9. Store listing and policy forms

Play Console → *Grow users → Store presence → Main store listing*. Copy the text from [`STORE_LISTING.md`](STORE_LISTING.md):

| Field | File |
| --- | --- |
| App icon 512×512 | `resources/icon.png` (Play scales it down) or export at 512 |
| Feature graphic 1024×500 | `store/play-feature-graphic.jpg` |
| Phone screenshots | `store/play-phone-*.jpg` (6 images) |
| 7" and 10" tablet screenshots (optional) | `store/ios-ipad-13-*.jpg` |

Policy → **App content** (all required):

- **Privacy policy:** your public URL from step 0.
- **Ads:** No ads.
- **App access:** All functionality is available without special access. Pro is a purchase, not a login.
- **Content rating:** fill in the IARC questionnaire. Category *Reference, News, or Educational*; answer No to everything. The result will be *Everyone / 3+*.
- **Target audience:** 13+ (choosing ages under 13 adds Families policy requirements).
- **Data safety:** see the answers in `STORE_LISTING.md`.
- **Government app:** No. **Financial features:** None. **Health:** None.

Store settings:

- Category: **Education**.
- Tags: Astronomy, Education, Reference.
- Contact e-mail and website.

### A10. Production

Run **Android release** with track `production`, or promote the tested release in Play Console. Countries: start with *all countries*.
- Review takes from a few hours to about 7 days.
- After the first approval, set `status: completed` in `.github/workflows/android-release.yml` if you want uploads to go live automatically.

Once the app is live, paste its link into `js/config.js → storeLinks.android`.

---

## B. Apple App Store

### B1. Apple Developer Program ($99 / ₹8,700 per year)

- Enrol at [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/) using an Apple ID with two-factor authentication.
- The **Apple Developer app** on iPhone is the fastest way to enrol, and you can pay there.
- An organisation needs its D-U-N-S number and legal-entity details.

### B2. Agreements, tax and banking (required for in-app purchases)

App Store Connect → **Business**:

1. Accept the **Paid Apps Agreement**.
2. Add the **bank account**.
3. Complete the **tax forms**: for India, the U.S. W-8BEN (individual) or W-8BEN-E (company), plus your Indian tax details.

Until the status is *Active*, in-app purchases cannot be tested or sold.

### B3. Register the app

1. [developer.apple.com/account](https://developer.apple.com/account) → *Certificates, IDs & Profiles → Identifiers → +* → **App IDs → App**:
   - Description: *Antariksha*
   - Bundle ID (explicit): `com.livingsanatan.antariksha`
   - Capabilities: **In-App Purchase** (already on by default)
2. [App Store Connect](https://appstoreconnect.apple.com) → **Apps → + → New App**:
   - Platform: iOS
   - Name: *Antariksha: Vedic Sky Map*
   - Primary language: English (U.S.) or English (U.K.)
   - Bundle ID: the one above
   - SKU: `antariksha`
   - Access: Full

### B4. App Store Connect API key and GitHub secrets

This lets GitHub's Mac build machine sign and upload the app. You do not need your own Mac, certificates or provisioning profiles.

1. App Store Connect → **Users and Access → Integrations → App Store Connect API → Team Keys → +**.
   - Name: *GitHub*
   - Access: **Admin**. Automatic signing creates certificates and profiles, so it needs Admin.
2. Download `AuthKey_XXXXXXXXXX.p8` (you can only download it **once**), and note the **Key ID** and the **Issuer ID** shown above the list.
3. Find your **Team ID** at developer.apple.com/account → *Membership details*.
4. Add these GitHub secrets:

| Secret | Value |
| --- | --- |
| `APPLE_TEAM_ID` | 10-character Team ID |
| `ASC_KEY_ID` | Key ID |
| `ASC_ISSUER_ID` | Issuer ID (a UUID) |
| `ASC_KEY_P8` | the full text of the `.p8` file, including the `-----BEGIN PRIVATE KEY-----` lines |

### B5. Build and send it to TestFlight

1. GitHub → **Actions → iOS release → Run workflow**. It takes about 15 min on a macOS runner with Xcode 26.
2. About 10–30 min later the build appears in App Store Connect → **TestFlight**.
   - The encryption question is already answered in `Info.plist` ("no non-exempt encryption").
3. TestFlight → **Internal testing** → add yourself.
4. Install the **TestFlight** app on your iPhone and test.

### B6. Create the in-app purchase

App Store Connect → your app → **Monetization → In-App Purchases → +**:

- Type: **Non-Consumable**
- Reference name: *Antariksha Pro*
- Product ID: `antariksha_pro_lifetime`
- **Availability:** all countries
- **Price schedule:**
  - Base country **India**, at the nearest point to ₹11.
  - Then *Manage pricing → United States* → $3.29 or $3.39 (see Pricing above).
- **App Store localisation:**
  - English: *Antariksha Pro* / *Kundali, Dasha, Navamsa and family profiles*
  - Hindi: *अन्तरिक्ष प्रो* / *कुण्डली, दशा, नवांश व परिवार प्रोफ़ाइल*
- **Review information:**
  - Screenshot: a screenshot of the paywall. In TestFlight, tap the Dasha tab, then take an iPhone screenshot.
  - Notes: *Unlocks the birth chart, dasha, D9 and saved profiles*.

The status becomes *Ready to Submit*. The first purchase **must be submitted together with an app version** (B8).

**Test the purchase** with a Sandbox tester: Users and Access → Sandbox → Testers. On the iPhone, sign in to that tester under Settings → Developer → Sandbox Apple Account. Then buy Pro in the TestFlight build. Sandbox purchases are free.

### B7. App information and privacy

| Section | What to enter |
| --- | --- |
| App Information | Category **Education** (primary) and **Reference** (secondary). Content rights: no third-party content requiring rights; the star data and illustrations are openly licensed (see README credits). Age rating: answer **None** to all → **4+**. |
| Pricing and Availability | Price **Free**, all countries |
| App Privacy | Privacy policy URL, then *Data types*: **Purchases → Purchase History**, used for **App Functionality**, **not linked** to identity, **not used for tracking**. Nothing else is collected; location, camera and birth details never leave the device. |
| Version 1.0 | Screenshots: **iPhone 6.9"** `store/ios-6.9-*.jpg` and **iPad 13"** `store/ios-ipad-13-*.jpg`. Promotional text, description, keywords, support URL and marketing URL from `STORE_LISTING.md`. Copyright: `2026 <legal name>`. |
| Build | Choose the TestFlight build from B5 |
| In-App Purchases | Tick *Antariksha Pro* so it is reviewed with this version |
| App Review Information | Contact details and the **review notes** from `STORE_LISTING.md`. No sign-in required. |

Optional: under App Store localisation, add **Hindi** with the Hindi copy from `STORE_LISTING.md`.

### B8. Submit

**Add for Review → Submit.** Review usually takes 24–48 hours.

- Release option: *Manually release this version*, so you control launch day.
- When it is approved, press **Release**.
- Paste the App Store link into `js/config.js → storeLinks.ios`.

---

## Why the listing is worded the way it is (App Review risk)

- Apple's guideline **4.3(b)** treats astrology, horoscope and fortune-telling apps as a *saturated category*. These apps are often rejected unless they offer something unique.
  - Antariksha *is* unique: a real-time AR planetarium with a live Panchang.
  - So the listing leads with **astronomy, the Vedic sky and the Panchang**, is categorised under **Education/Reference**, and presents Jyotish as Vedic astronomical tradition rather than predictions.
  - Keep it that way. Do not use words like *horoscope*, *predictions* or *fortune* in the name, subtitle or screenshots.
- Guideline **4.2** (minimum functionality) is about apps that just wrap a website. Antariksha uses the native camera, motion sensors, location and StoreKit in-app purchase, and works fully offline, so it is a real app.
- If Apple still rejects it:
  - Reply in Resolution Center, describing the planetarium, AR and Panchang as the core features and quoting the review notes.
  - Or offer a version without the Kundali/Dasha tabs. A free toggle in `js/app.js` (`PRO_TABS`) and the D9 option are the only places involved.

---

## Version 1.1 (this update): what changes for the stores

| | |
| --- | --- |
| New permission | **Notifications**, only when the user turns on reminders. Android 13+ shows the system prompt then; iOS asks the same way. Play needs no extra declaration: these are local notifications and the app does not use exact alarms. |
| Privacy answers | Unchanged. Reminders are scheduled on the phone; no data leaves it. |
| Screenshots | 7 per device in `store/`. Re-run `npm run store-shots` (needs `npm i --no-save playwright`) after design changes. |
| "What's new" text | In [`STORE_LISTING.md`](STORE_LISTING.md). |
| Pro | Unchanged. Every new feature is free. |

If you publish 1.0.0 first, ship 1.1.0 with a `v1.1.0` tag. If 1.1.0 is your first release, just use it as is.

## Releasing updates

```sh
npm run version -- 1.0.1     # updates js/config.js, package.json, Android versionName and iOS MARKETING_VERSION
git commit -am "Release 1.0.1" && git tag v1.0.1 && git push && git push --tags
```

The tag starts **both** release workflows:

- **iOS:** the build lands in TestFlight. Create version 1.0.1 in App Store Connect, pick the build and submit.
- **Android:** the bundle uploads to the internal track if A7 is set up; otherwise download the artifact and upload it.

Build numbers (`versionCode`, `CURRENT_PROJECT_VERSION`) increase automatically with each workflow run.

Website-only changes (HTML, CSS, JS) still need a new app build, because the app bundles the web files so it can work offline.

## Working on the native apps locally (optional)

```sh
npm ci
npm run sync        # copies the web app into ios/ and android/
npm run android     # opens Android Studio (any OS)
npm run ios         # opens Xcode (Mac only)
npm run assets      # regenerate icons/splash from resources/
npm test            # astronomy, sensor and magnetic-model checks
```

## Checklist

- [ ] Step 0: legal name in `terms.html`, support inbox works, legal pages live on livingsanatan.com, branch merged to `main`
- [ ] R1–R4: RevenueCat project, entitlement `pro`, offering, keys in `js/config.js`
- [ ] A1–A5: Play account, app created, upload key and secrets, first AAB uploaded to internal testing
- [ ] A6: product `antariksha_pro_lifetime` at ₹11 / $3.33, activated
- [ ] A7: service account (RevenueCat + `PLAY_SERVICE_ACCOUNT_JSON`)
- [ ] A8: 12 testers × 14 days (personal accounts only)
- [ ] A9–A10: listing, App content forms, production release
- [ ] B1–B4: Apple account, agreements, bundle ID, API key secrets
- [ ] B5: TestFlight build tested on iPhone
- [ ] B6: in-app purchase created and tested in Sandbox
- [ ] B7–B8: privacy labels, screenshots, review notes, submitted together with the purchase
- [ ] After launch: `storeLinks` in `js/config.js`, update livingsanatan.com with App Store and Play badges
