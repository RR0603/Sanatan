// Builds the ready-to-upload store kit in fastlane/ (the layout fastlane `deliver` and `supply` read) from
// STORE_LISTING.md and store/. Every text field is checked against its store limit.
// Usage: npm run store-kit
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const md = readFileSync(join(root, 'STORE_LISTING.md'), 'utf8');
const ctx = {}; ctx.window = ctx; vm.runInNewContext(readFileSync(join(root, 'js/config.js'), 'utf8'), ctx);
const C = ctx.LS.CONFIG;
const problems = [];

// "**Field (limit)**: text [count]" lines, in the English or Hindi section.
const section = (name) => { const i = md.indexOf(`## ${name}`); const j = md.indexOf('\n## ', i + 4); return md.slice(i, j < 0 ? undefined : j); };
const en = section('English'), hi = section('हिन्दी');
const field = (sec, label) => {
  const m = sec.match(new RegExp(`\\*\\*${label.replace(/[()]/g, '\\$&')} \\((\\d+)\\)\\*\\*: (.*?) \\[\\d+\\]\\s*$`, 'm'));
  if (!m) { problems.push(`missing field "${label}"`); return ''; }
  if ([...m[2]].length > +m[1]) problems.push(`"${label}" is ${[...m[2]].length} characters, limit ${m[1]}`);
  return m[2].trim();
};
const block = (sec, label) => { const i = sec.indexOf(label); if (i < 0) { problems.push(`missing ${label}`); return ''; } const a = sec.indexOf('```', i) + 3; return sec.slice(sec.indexOf('\n', a) + 1, sec.indexOf('```', a)).trim(); };
const appName = (md.match(/\| App name \(30\) \| (.*?) \[\d+\] \|/) || [])[1] || 'Antariksha: Vedic Sky Map';
const hiName = field(hi, 'Name');
const descEn = block(en, '**Description (4000)**'), descHi = block(hi, '**Description**');
const whatsNew = block(en, "**What's new"), whatsNewHi = block(hi, "**What's new");
const review = block(md, '## App Review notes');
for (const [k, v, lim] of [['description (en)', descEn, 4000], ['description (hi)', descHi, 4000], ['release notes (en)', whatsNew, 4000], ['release notes (hi)', whatsNewHi, 4000]]) if ([...v].length > lim) problems.push(`${k} too long`);

const out = join(root, 'fastlane');
rmSync(join(out, 'metadata'), { recursive: true, force: true });
rmSync(join(out, 'screenshots'), { recursive: true, force: true });
const put = (path, text) => { mkdirSync(dirname(join(out, path)), { recursive: true }); writeFileSync(join(out, path), `${text}\n`); };
const site = C.links.web;

// ---------- App Store (fastlane deliver) ----------
for (const [loc, sec, name, desc, notes] of [['en-US', en, appName, descEn, whatsNew], ['hi', hi, hiName, descHi, whatsNewHi]]) {
  put(`metadata/ios/${loc}/name.txt`, name);
  put(`metadata/ios/${loc}/subtitle.txt`, field(sec, 'Apple subtitle'));
  put(`metadata/ios/${loc}/promotional_text.txt`, field(sec, 'Apple promotional text'));
  put(`metadata/ios/${loc}/keywords.txt`, field(sec, 'Apple keywords'));
  put(`metadata/ios/${loc}/description.txt`, desc);
  put(`metadata/ios/${loc}/release_notes.txt`, notes);
  put(`metadata/ios/${loc}/support_url.txt`, `${site}support.html`);
  put(`metadata/ios/${loc}/marketing_url.txt`, C.links.site);
  put(`metadata/ios/${loc}/privacy_url.txt`, `${site}privacy.html`);
}
put('metadata/ios/copyright.txt', `${new Date().getFullYear()} Living Sanatan`);
put('metadata/ios/primary_category.txt', 'EDUCATION');
put('metadata/ios/secondary_category.txt', 'REFERENCE');
put('metadata/ios/review_information/email_address.txt', C.links.email);
put('metadata/ios/review_information/notes.txt', review);
put('metadata/ios/review_information/demo_required.txt', 'false');

// ---------- Google Play (fastlane supply) ----------
// Play release notes are limited to 500 characters: keep whole lines that fit.
const playNotes = (notes) => notes.split('\n').reduce((acc, line) => ([...`${acc}\n${line}`].length <= 500 ? (acc ? `${acc}\n${line}` : line) : acc), '');
for (const [loc, sec, name, desc, notes] of [['en-US', en, appName, descEn, whatsNew], ['hi-IN', hi, hiName, descHi, whatsNewHi]]) {
  put(`metadata/android/${loc}/title.txt`, name);
  put(`metadata/android/${loc}/short_description.txt`, field(sec, 'Play short description'));
  put(`metadata/android/${loc}/full_description.txt`, desc);
  put(`metadata/android/${loc}/changelogs/default.txt`, playNotes(notes));
}

// ---------- images ----------
const shots = readdirSync(join(root, 'store')).filter((f) => f.endsWith('.jpg')).sort();
const copy = (f, to) => { mkdirSync(dirname(join(out, to)), { recursive: true }); copyFileSync(join(root, 'store', f), join(out, to)); };
let n = 0;
for (const f of shots.filter((x) => x.startsWith('ios-6.9-'))) copy(f, `screenshots/en-US/${++n}_iphone69_${f.replace('ios-6.9-', '')}`);
n = 0;
for (const f of shots.filter((x) => x.startsWith('ios-ipad-13-'))) copy(f, `screenshots/en-US/${++n}_ipadPro13_${f.replace('ios-ipad-13-', '')}`);
n = 0;
for (const f of shots.filter((x) => x.startsWith('play-phone-'))) copy(f, `metadata/android/en-US/images/phoneScreenshots/${++n}_${f.replace('play-phone-', '')}`);
n = 0;
for (const f of shots.filter((x) => x.startsWith('ios-ipad-13-'))) copy(f, `metadata/android/en-US/images/tenInchScreenshots/${++n}_${f.replace('ios-ipad-13-', '')}`);
if (existsSync(join(root, 'store/play-feature-graphic.jpg'))) copy('play-feature-graphic.jpg', 'metadata/android/en-US/images/featureGraphic.jpg');
if (existsSync(join(root, 'store/play-icon-512.png'))) copy('play-icon-512.png', 'metadata/android/en-US/images/icon.png');
else problems.push('store/play-icon-512.png missing');

console.log(`fastlane/ written: App Store (en-US, hi) and Google Play (en-US, hi-IN) metadata, ${shots.length} images.`);
if (problems.length) { console.log(problems.map((p) => `✗ ${p}`).join('\n')); process.exit(1); }
console.log('✓ every field within its store limit');
