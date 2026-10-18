// Copies the static web app into www/ (Capacitor's webDir) for the iOS / Android builds.
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
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
console.log(`web app copied to ${out}`);
