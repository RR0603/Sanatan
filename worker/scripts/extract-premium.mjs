#!/usr/bin/env node
// Moves premium era content out of the public script.js and into a private
// Cloudflare KV bulk-upload file.
//
//   node scripts/extract-premium.mjs --in ../script.js --out ../script.js \
//        --kv .private/premium-kv.json [--free 3]
//
// What counts as premium (keep in sync with PREMIUM in ../../premium.js):
//   * eras with index >= FREE_ERAS (default 3: brahman, spanda, nada stay free)
//   * their layers: meta, bio, neuro, quantum, inner
//   * their "Discover Deeper" panel sections (panel.secs)
// The History layer, body, quote, fractal, tags and FAQ stay public so search
// engines still index every era.
//
// Each premium era object gets `premium:true` and the moved values become
// `null` (layers) / `[]` (panel.secs). The KV file holds one key per era:
//   era:<id>  ->  {"layers":{...},"secs":[...]}
// NEVER commit the KV file. The repo is public.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import vm from 'node:vm';
import * as acorn from 'acorn';

const PREMIUM_LAYERS = ['meta', 'bio', 'neuro', 'quantum', 'inner'];

function arg(name, fallback) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 ? process.argv[i + 1] : fallback;
}

const inPath = arg('in', '../script.js');
const outPath = arg('out', inPath);
const kvPath = arg('kv', '.private/premium-kv.json');
const FREE_ERAS = Number(arg('free', '3'));

const src = readFileSync(inPath, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });

let erasNode = null;
for (const stmt of ast.body) {
  if (stmt.type !== 'VariableDeclaration') continue;
  for (const d of stmt.declarations) {
    if (d.id.name === 'ERAS' && d.init && d.init.type === 'ArrayExpression') erasNode = d.init;
  }
}
if (!erasNode) throw new Error('Could not find `const ERAS=[...]` in ' + inPath);

const keyOf = (p) => (p.key.type === 'Identifier' ? p.key.name : p.key.value);
const prop = (obj, name) => obj.properties.find((p) => p.type === 'Property' && keyOf(p) === name);
const evalLiteral = (node) => vm.runInNewContext('(' + src.slice(node.start, node.end) + ')', {}, { timeout: 1000 });

const edits = []; // {start, end, text}
const kv = [];

erasNode.elements.forEach((era, idx) => {
  const id = evalLiteral(prop(era, 'id').value);
  if (prop(era, 'premium')) throw new Error(`Era "${id}" is already marked premium; this file was already extracted.`);
  if (idx < FREE_ERAS) return;

  const record = { layers: {}, secs: [] };
  const layers = prop(era, 'layers');
  if (layers && layers.value.type === 'ObjectExpression') {
    for (const name of PREMIUM_LAYERS) {
      const p = prop(layers.value, name);
      if (!p) continue;
      record.layers[name] = evalLiteral(p.value);
      edits.push({ start: p.value.start, end: p.value.end, text: 'null' });
    }
  }
  const panel = prop(era, 'panel');
  const secs = panel && panel.value.type === 'ObjectExpression' && prop(panel.value, 'secs');
  if (secs) {
    record.secs = evalLiteral(secs.value);
    edits.push({ start: secs.value.start, end: secs.value.end, text: '[]' });
  }
  // Mark the era so the client knows to fetch its premium content.
  edits.push({ start: era.start + 1, end: era.start + 1, text: '\n  premium:true,' });
  kv.push({ key: 'era:' + id, value: JSON.stringify(record) });
});

let out = src;
for (const e of edits.sort((a, b) => b.start - a.start)) {
  out = out.slice(0, e.start) + e.text + out.slice(e.end);
}

// Sanity check: the result must still parse.
acorn.parse(out, { ecmaVersion: 'latest', sourceType: 'script' });

mkdirSync(dirname(kvPath), { recursive: true });
writeFileSync(kvPath, JSON.stringify(kv));
writeFileSync(outPath, out);

const moved = kv.reduce((n, r) => n + r.value.length, 0);
console.log(`Premium eras: ${kv.length} (free: first ${FREE_ERAS})`);
console.log(`Moved ${(moved / 1024).toFixed(0)} KB of content -> ${kvPath}`);
console.log(`script.js: ${(src.length / 1024).toFixed(0)} KB -> ${(out.length / 1024).toFixed(0)} KB (${outPath})`);
