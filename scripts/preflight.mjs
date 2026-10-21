// Release preflight: everything App Review / Play review would catch, checked before a store build.
// Usage: npm run preflight           (fails with a list of problems)
//        npm run preflight -- --warn (reports only; used by CI on pull requests)
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');
const problems = [], ok = [];
const need = (cond, good, bad) => (cond ? ok.push(good) : problems.push(bad));

// --- launch configuration (js/config.js) ---
const ctx = {}; ctx.window = ctx;
vm.runInNewContext(read('js/config.js'), ctx);
const C = ctx.LS.CONFIG;
need(/^appl_[A-Za-z0-9]{10,}$/.test(C.pro.revenueCat.ios), 'RevenueCat iOS key set', 'js/config.js: pro.revenueCat.ios is empty or not an "appl_…" public key (LAUNCH.md step R4) — without it the Unlock button cannot sell');
need(/^goog_[A-Za-z0-9]{10,}$/.test(C.pro.revenueCat.android), 'RevenueCat Android key set', 'js/config.js: pro.revenueCat.android is empty or not a "goog_…" public key (LAUNCH.md step R4)');
need(C.pro.productId === 'antariksha_pro_lifetime' && C.pro.entitlement === 'pro', 'product/entitlement ids', 'js/config.js: productId/entitlement changed — they must match App Store Connect, Play Console and RevenueCat');
need(/^https:\/\/.+\/$/.test(C.links.web || ''), 'public legal-pages URL set', 'js/config.js: links.web must be the https:// folder where privacy.html is published (with a trailing /)');
need(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(C.links.email || ''), 'support e-mail set', 'js/config.js: links.email is not a valid address');
need(C.pro.webMode === 'stores' || C.pro.webMode === 'free', 'web mode valid', 'js/config.js: pro.webMode must be "stores" or "free"');

// --- legal pages ---
need(!/\[legal name/i.test(read('terms.html')), 'terms.html has the legal name', 'terms.html still contains the "[legal name …]" placeholder (LAUNCH.md step 0)');
for (const f of ['privacy.html', 'terms.html', 'support.html']) need(read(f).includes(C.links.email), `${f} lists the support e-mail`, `${f} does not mention ${C.links.email}`);

// --- versions agree everywhere ---
const v = C.version;
const pkg = JSON.parse(read('package.json')).version;
const gradle = (read('android/app/build.gradle').match(/versionName "([^"]+)"/) || [])[1];
const xcode = [...read('ios/App/App.xcodeproj/project.pbxproj').matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((m) => m[1]);
need(pkg === v && gradle === v && xcode.length && xcode.every((x) => x === v), `version ${v} everywhere`, `version mismatch: config ${v}, package ${pkg}, gradle ${gradle}, xcode ${xcode.join('/')} — run npm run version -- ${v}`);

// --- iOS (App Store Review Guidelines 5.1.1, privacy manifest, export compliance) ---
const plist = read('ios/App/App/Info.plist');
for (const k of ['NSCameraUsageDescription', 'NSLocationWhenInUseUsageDescription', 'NSMotionUsageDescription'])
  need(new RegExp(`<key>${k}</key>\\s*<string>[^<]{30,}</string>`).test(plist), `${k} explained`, `Info.plist: ${k} missing or too short`);
need(/<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/.test(plist), 'export compliance answered', 'Info.plist: ITSAppUsesNonExemptEncryption should be false');
need(!/NSLocationAlways/.test(plist), 'no background location', 'Info.plist asks for background location — not needed, remove it');
need(existsSync(join(root, 'ios/App/App/PrivacyInfo.xcprivacy')) && read('ios/App/App.xcodeproj/project.pbxproj').includes('PrivacyInfo.xcprivacy in Resources'), 'privacy manifest bundled', 'ios/App/App/PrivacyInfo.xcprivacy missing or not in the Xcode target');

// --- Android (Play policies) ---
const man = read('android/app/src/main/AndroidManifest.xml');
need(/SCHEDULE_EXACT_ALARM" tools:node="remove"/.test(man), 'no exact-alarm permission', 'AndroidManifest: SCHEDULE_EXACT_ALARM must be removed (Play exact-alarm policy)');
need(!/ACCESS_BACKGROUND_LOCATION/.test(man), 'no background location', 'AndroidManifest: ACCESS_BACKGROUND_LOCATION needs a Play declaration — remove it');
need(/android:allowBackup="false"/.test(man), 'no cloud backup of birth data', 'AndroidManifest: allowBackup should be false (privacy policy says data stays on the device)');
const sdk = read('android/variables.gradle');
const target = +(sdk.match(/targetSdkVersion\s*=\s*(\d+)/) || [])[1];
need(target >= 35, `targetSdk ${target}`, `android/variables.gradle: targetSdkVersion ${target} — Google Play requires 35+ (36 from 31 Aug 2026)`);
need(existsSync(join(root, 'android/app/src/main/res/drawable/ic_stat_antariksha.xml')), 'notification icon', 'missing Android notification icon');

// --- no secrets or debug switches in the shipped code ---
const shipped = ['js/app.js', 'js/pro.js', 'js/pages.js', 'js/config.js', 'index.html'].map(read).join('\n');
need(!/sk_[A-Za-z0-9]{20,}|BEGIN (RSA |EC )?PRIVATE KEY/.test(shipped), 'no secret keys in the app', 'a secret key appears in shipped code — only RevenueCat PUBLIC keys (appl_/goog_) may ship');
const cap = JSON.parse(read('capacitor.config.json'));
need(!cap.server || !cap.server.url, 'app loads bundled files', 'capacitor.config.json: server.url is set (live reload) — remove it for store builds');
need(cap.android.webContentsDebuggingEnabled === false && cap.ios.webContentsDebuggingEnabled === false, 'web debugging off', 'capacitor.config.json: turn webContentsDebuggingEnabled off');

console.log(ok.map((x) => `✓ ${x}`).join('\n'));
if (problems.length) {
  console.log(`\n${problems.length} problem(s) before this can go to the stores:\n` + problems.map((x) => `✗ ${x}`).join('\n'));
  if (!process.argv.includes('--warn')) process.exit(1);
} else console.log('\nReady for the stores.');
