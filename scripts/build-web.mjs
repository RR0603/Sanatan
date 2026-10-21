// Copies the static web app into www/ (Capacitor's webDir) for the iOS / Android builds.
import { cpSync, mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const include = [
  'index.html', 'privacy.html', 'terms.html', 'support.html', 'manifest.webmanifest',
  'css', 'js', 'img', 'fonts',
];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const item of include) {
  const src = join(root, item);
  if (!existsSync(src)) throw new Error(`missing ${item}`);
  cpSync(src, join(out, item), { recursive: true });
}
// The website's Content-Security-Policy is left out of the app build: on older Android System WebViews
// Capacitor injects its bridge as an inline script, which that policy would block. The app has no
// remote content to protect against (everything is bundled).
const html = join(out, 'index.html');
const page = readFileSync(html, 'utf8');
const stripped = page.replace(/\s*<!-- Everything ships with the app[^>]*-->\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, '');
if (stripped === page) throw new Error('CSP meta not found in index.html');
writeFileSync(html, stripped);
console.log(`web app copied to ${out}`);
