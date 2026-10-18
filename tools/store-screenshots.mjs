// Generates App Store / Google Play screenshots and the Play feature graphic into store/.
// Usage: npm run serve (in another terminal), then: npm run store-shots
// ONLY=1 regenerates just the missing files.
// Needs Playwright: npm i --no-save playwright && npx playwright install chromium
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const existsMissing = (n, id) => !existsSync(join(OUT, `${n}-${id}.jpg`));
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.APP_URL || 'http://127.0.0.1:8000/';
const OUT = join(ROOT, 'store');

// Store sizes: [name, css width, css height, device scale]
const DEVICES = [
  ['ios-6.9', 440, 956, 3],      // 1320 x 2868 — iPhone 6.9" (required)
  ['ios-ipad-13', 1032, 1376, 2], // 2064 x 2752 — iPad 13" (required because the app runs on iPad)
  ['play-phone', 360, 640, 3],    // 1080 x 1920 — Google Play phone
];

const NIGHT = Date.parse('2026-10-18T22:00:00Z'); // 03:30 IST, Ujjain: Orion, Gemini, Guru and Mangala rising

const SCENES = [
  { id: '1-sky', cap: ['Point your phone.', 'See the Vedic sky.'], sub: 'Nakshatras, rashis and grahas over the real sky — live',
    run: async (p) => { await sky(p, 98, 36, 82); } },
  { id: '2-graha', cap: ['Every graha,', 'every nakshatra.'], sub: 'Rashi, nakshatra, pada, dignity, rise and set',
    run: async (p) => { await sky(p, 98, 36, 70); await p.evaluate(() => { const a = window.__antariksha; a.select({ type: 'graha', id: 'guru' }); a.goTo({ type: 'graha', id: 'guru' }, false); }); await p.waitForTimeout(1300); } },
  { id: '3-panchang', cap: ['Panchang for', 'where you stand.'], sub: 'Tithi, nakshatra, yoga, karana, lagna — to the minute',
    run: async (p) => { await sky(p, 160, 30, 90); await p.click('#hudClock'); await p.click('#btnPanchang'); await p.waitForTimeout(700); } },
  { id: '4-bhachakra', cap: ['Bhachakra —', 'the living sky as a chart.'], sub: 'Drag the wheel to travel through time',
    run: async (p) => { await sky(p, 98, 36, 82); await p.click('.mode[data-mode="jyotish"]'); await p.waitForTimeout(1200); } },
  { id: '5-kundali', cap: ['Your Janma Kundali', '& Dasha.'], sub: 'North & South Indian, Navamsa D9, Vimshottari — Antariksha Pro',
    run: async (p) => {
      await p.click('.mode[data-mode="jyotish"]'); await p.waitForTimeout(600);
      await p.click('#jyTabs [data-tab="janma"]'); await p.fill('#bName', 'Arjun'); await p.fill('#bDate', '1990-06-15T06:30');
      await p.selectOption('#bPlace', 'delhi'); await p.click('[data-act="cast"]'); await p.waitForTimeout(1000);
      await p.evaluate(() => document.querySelector('.jy-panel').scrollIntoView({ block: 'start' })); await p.waitForTimeout(300);
    } },
  { id: '6-hindi', cap: ['हिन्दी · English', 'Jyotish & Western names'], sub: 'वैदिक आकाश — आपकी भाषा में',
    run: async (p) => {
      await p.click('#btnMenu'); await p.click('#langSeg [data-lang="hi"]'); await p.keyboard.press('Escape');
      await p.evaluate(() => document.getElementById('scrim').click()); await p.waitForTimeout(400);
      await sky(p, 98, 36, 82);
    } },
];

async function sky(p, az, alt, fov) {
  await p.evaluate(([az, alt, fov, t]) => {
    const a = window.__antariksha; a.clock.sim = t; a.clock.rate = 0;
    a.view.az = az; a.view.alt = alt; a.view.fov = fov; a.invalidate();
  }, [az, alt, fov, NIGHT]);
  await p.waitForTimeout(1500);
}

const fontCss = readFileSync(join(ROOT, 'css/fonts.css'), 'utf8').replaceAll('../fonts/', `${BASE}fonts/`);
function frame(shot, scene, w, h) {
  const big = w > 600;
  // The framed screenshot has the viewport's aspect ratio; shrink it on short screens so it clears the caption.
  const pct = Math.min(big ? 74 : 82, Math.floor(((h - (big ? 260 : 190) + (big ? 40 : 24)) / h) * 100));
  return `<html><head><style>${fontCss}
    body{margin:0;width:${w}px;height:${h}px;overflow:hidden;font-family:'Space Grotesk','Noto Sans Devanagari',sans-serif;color:#fff;
      background:radial-gradient(120% 60% at 50% 0%,#2a2f6b 0,#0b1033 45%,#03050f 100%)}
    .cap{position:absolute;top:${big ? 70 : 46}px;left:0;right:0;text-align:center;padding:0 24px}
    h1{margin:0;font-size:${big ? 54 : 31}px;line-height:1.12;font-weight:700;letter-spacing:-.01em}
    h1 span{display:block}
    h1 span:last-child{background:linear-gradient(90deg,#ffd27a,#ff8a3d);-webkit-background-clip:text;color:transparent}
    p{margin:${big ? 16 : 10}px auto 0;font-size:${big ? 22 : 14}px;color:rgba(235,240,255,.75);max-width:${big ? 760 : 360}px}
    .shot{position:absolute;left:50%;transform:translateX(-50%);bottom:${big ? -40 : -24}px;width:${pct}%;
      border-radius:${big ? 44 : 30}px;overflow:hidden;box-shadow:0 0 0 ${big ? 10 : 6}px rgba(255,255,255,.08),0 30px 90px rgba(0,0,0,.7),0 0 120px rgba(255,150,60,.18)}
    .shot img{display:block;width:100%}
  </style></head><body><div class="cap"><h1><span>${scene.cap[0]}</span><span>${scene.cap[1]}</span></h1><p>${scene.sub}</p></div>
  <div class="shot"><img src="data:image/png;base64,${shot.toString('base64')}"></div></body></html>`;
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [name, w, h, dpr] of DEVICES) {
  for (const scene of SCENES) {
    if (process.env.ONLY && !existsMissing(name, scene.id)) continue;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: w < 900, hasTouch: true, timezoneId: 'Asia/Kolkata', locale: 'en-IN' });
    await ctx.addInitScript(() => { try { sessionStorage.setItem('antariksha.intro', '1'); } catch (e) { /* ignore */ } });
    const p = await ctx.newPage();
    await p.goto(BASE + '?preview');
    await p.waitForTimeout(1500);
    await p.evaluate(() => { document.getElementById('intro').hidden = true; document.getElementById('locToast').hidden = true; });
    await scene.run(p);
    const shot = await p.screenshot();
    const fp = await (await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })).newPage();
    await fp.setContent(frame(shot, scene, w, h)); await fp.waitForTimeout(400);
    await fp.screenshot({ path: join(OUT, `${name}-${scene.id}.jpg`), type: 'jpeg', quality: 92 });
    await ctx.close();
    console.log('✓', name, scene.id);
  }
}
// Google Play feature graphic 1024 x 500
{
  const p = await (await browser.newContext({ viewport: { width: 1024, height: 500 }, timezoneId: 'Asia/Kolkata' })).newPage();
  await p.goto(BASE + '?preview'); await p.waitForTimeout(1200);
  await p.evaluate(() => { for (const id of ['intro', 'locToast']) document.getElementById(id).hidden = true; document.getElementById('ui').style.display = 'none'; });
  await sky(p, 98, 36, 95);
  const bg = await p.screenshot();
  const icon = readFileSync(join(ROOT, 'img/icon.svg'));
  await p.setContent(`<html><head><style>${fontCss} body{margin:0;width:1024px;height:500px;overflow:hidden;font-family:'Space Grotesk',sans-serif;color:#fff}
    .bg{position:absolute;inset:0;background:url(data:image/png;base64,${bg.toString('base64')}) center/cover}
    .fade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(3,5,15,.92) 0,rgba(3,5,15,.6) 48%,rgba(3,5,15,0) 75%)}
    .t{position:absolute;left:64px;top:140px} img{width:96px;height:96px;border-radius:22px;box-shadow:0 0 60px rgba(255,160,70,.5)}
    h1{margin:18px 0 6px;font-size:58px;letter-spacing:.02em} p{margin:0;font-size:22px;color:rgba(235,240,255,.82)}</style></head>
    <body><div class="bg"></div><div class="fade"></div><div class="t"><img src="data:image/svg+xml;base64,${icon.toString('base64')}">
    <h1>Antariksha</h1><p>The Vedic sky, live — by Living Sanatan</p></div></body></html>`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: join(OUT, 'play-feature-graphic.jpg'), type: 'jpeg', quality: 92 });
  console.log('✓ play-feature-graphic');
}
await browser.close();
