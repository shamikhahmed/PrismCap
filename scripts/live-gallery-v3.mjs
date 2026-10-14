#!/usr/bin/env node
/** Live-URL gallery v3 — Home / Library / Profile × light/dark × devices. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY_DIR = join(ROOT, 'docs', 'screenshots', 'gallery');
const MANIFEST = join(GALLERY_DIR, 'gallery-manifest.json');
const BASE = process.env.GALLERY_BASE_URL || 'https://shamikhahmed.github.io/PrismCap/?demo=1&e2e=1';
const ACCENT = '#BF5AF2';
const CAPTURED_AT = new Date().toISOString();

const pwRoot =
  process.env.PW_CORE || join(ROOT, '..', 'MasteryCap', 'node_modules', 'playwright-core');
const { chromium } = createRequire(import.meta.url)(pwRoot);

const VIEWPORTS = {
  iphone: { width: 390, height: 844, deviceScaleFactor: 3 },
  ipad: { width: 1180, height: 820, deviceScaleFactor: 2 },
  mac: { width: 1440, height: 900, deviceScaleFactor: 2 },
};

const SCREENS = [
  { nav: 'home', group: 'Home', screen: 'Home', caption: 'Daily challenge and featured games (demo).' },
  { nav: 'library', group: 'Games', screen: 'Library', caption: 'Browse and search the game library.' },
  { nav: 'profile', group: 'Settings', screen: 'Profile', caption: 'Theme, audio, and player settings.' },
];

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function shotPath(theme, device, group, screen) {
  return `${theme}/${device}/${slug(group)}--${slug(screen)}--demo.webp`;
}

function pngToWebp(pngPath, webpPath) {
  mkdirSync(dirname(webpPath), { recursive: true });
  if (spawnSync('cwebp', ['-q', '82', pngPath, '-o', webpPath]).status === 0 && existsSync(webpPath)) {
    try {
      unlinkSync(pngPath);
    } catch {
      /* */
    }
    return;
  }
  spawnSync('cp', [pngPath, webpPath]);
}

function wipeLegacyGallery() {
  mkdirSync(GALLERY_DIR, { recursive: true });
  for (const f of readdirSync(GALLERY_DIR)) {
    if (/\.(png|webp)$/i.test(f)) unlinkSync(join(GALLERY_DIR, f));
  }
  for (const theme of ['light', 'dark']) {
    for (const device of ['iphone', 'ipad', 'mac']) {
      const sub = join(GALLERY_DIR, theme, device);
      if (!existsSync(sub)) continue;
      for (const f of readdirSync(sub)) {
        if (f.endsWith('.webp') || f.endsWith('.png')) unlinkSync(join(sub, f));
      }
    }
  }
}

async function setTheme(page, theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.evaluate((t) => {
    const root = document.documentElement;
    root.dataset.theme = t;
    root.dataset.capTheme = t;
    root.classList.toggle('light', t === 'light');
    root.classList.toggle('dark', t === 'dark');
    if (document.body) {
      document.body.classList.toggle('light', t === 'light');
      document.body.classList.toggle('dark', t === 'dark');
    }
    if (typeof Theme !== 'undefined') Theme.apply('');
  }, theme);
  await page.waitForTimeout(220);
}

async function bootDemo(page) {
  await page.waitForFunction(
    () => typeof Nav !== 'undefined' && window.__APP_READY__ === true,
    null,
    { timeout: 45000 },
  );
  await page.evaluate(() => {
    document.getElementById('splash')?.classList.add('hide');
    Nav.go('home');
  });
  await page.waitForSelector('#home-screen.active', { timeout: 20000 });
  await page.waitForTimeout(400);
}

async function goNav(page, navId) {
  await page.evaluate((id) => Nav.go(id), navId);
  await page.waitForSelector(`#${navId}-screen.active`, { timeout: 20000 });
  await page.waitForTimeout(350);
}

async function main() {
  wipeLegacyGallery();
  const shots = [];
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [device, vp] of Object.entries(VIEWPORTS)) {
      for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: vp.deviceScaleFactor,
          colorScheme: theme,
          isMobile: device !== 'mac',
          hasTouch: device !== 'mac',
        });
        const page = await context.newPage();
        await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await bootDemo(page);
        await setTheme(page, theme);

        for (const scr of SCREENS) {
          await goNav(page, scr.nav);
          await setTheme(page, theme);
          const rel = shotPath(theme, device, scr.group, scr.screen);
          const webpPath = join(GALLERY_DIR, rel);
          const pngPath = webpPath.replace(/\.webp$/, '.png');
          mkdirSync(dirname(pngPath), { recursive: true });
          await page.screenshot({ path: pngPath, animations: 'disabled' });
          pngToWebp(pngPath, webpPath);
          shots.push({
            id: `${slug(scr.group)}--${slug(scr.screen)}--demo`,
            group: scr.group,
            screen: scr.screen,
            state: 'demo',
            theme,
            device,
            file: rel,
            route: `#/${scr.nav}`,
            caption: scr.caption,
            w: vp.width * vp.deviceScaleFactor,
            h: vp.height * vp.deviceScaleFactor,
          });
          process.stdout.write(`✓ ${theme}/${device}/${scr.nav}\n`);
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const version = JSON.parse(readFileSync(join(ROOT, 'VERSION.json'), 'utf8')).version;
  writeFileSync(
    MANIFEST,
    JSON.stringify({ app: 'PrismCap', version, capturedAt: CAPTURED_AT, accent: ACCENT, schema: 2, shots }, null, 2),
  );
  console.log(`\nPrismCap gallery v3: ${shots.length} shots → ${MANIFEST}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
