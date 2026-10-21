// Usage: npm run version -- 1.0.1
// Sets the app version everywhere it appears (web config, package.json, iOS and Android projects).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const v = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(v || '')) { console.error('usage: npm run version -- <major.minor.patch>'); process.exit(1); }
const edit = (file, re, rep) => {
  const p = join(root, file);
  if (!existsSync(p)) return;
  const s = readFileSync(p, 'utf8'), n = s.replace(re, rep);
  if (s !== n) { writeFileSync(p, n); console.log('updated', file); }
};
edit('js/config.js', /version: '[^']*'/, `version: '${v}'`);
edit('package.json', /"version": "[^"]*"/, `"version": "${v}"`);
edit('android/app/build.gradle', /versionName "[^"]*"/, `versionName "${v}"`);
edit('ios/App/App.xcodeproj/project.pbxproj', /MARKETING_VERSION = [^;]*;/g, `MARKETING_VERSION = ${v};`);
console.log(`version ${v}. Build numbers are set automatically by the release workflows.`);
