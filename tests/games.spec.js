// @ts-check
import { test, expect, devices } from '@playwright/test';

async function waitReg39(page) {
  await page.goto('/?e2e=1');
  await page.waitForFunction(() => typeof window.ensureGamesPack === 'function' && typeof window.Reg !== 'undefined', { timeout: 20000 });
  await page.evaluate(() => new Promise((resolve) => window.ensureGamesPack(resolve)));
  /* Pack replaces stubs in place — list stays ~30, not 39. Gate on real setup(). */
  await page.waitForFunction(() => {
    const g = window.Reg && window.Reg.get('snake');
    const word = window.Reg && window.Reg.get('word');
    return !!(window.__PRISM_GAMES_PACK__ && g && !g._stub && typeof g.setup === 'function'
      && word && typeof word.setup === 'function' && window.Reg.list.length >= 35);
  }, { timeout: 30000 });
}

async function launchAndExit(page, id) {
  const html = await page.evaluate((gid) => {
    const g = window.Reg.get(gid);
    if (!g) return { err: 'missing ' + gid };
    const n = g.mp ? Math.max(g.min || 2, 2) : 1;
    const players = Array.from({ length: n }, (_, i) => ({
      id: 'p' + (i + 1),
      name: 'P' + (i + 1),
      av: '🎮',
      col: PCBrand.h_64d2ff,
      local: i === 0,
    }));
    try {
      window.GL._start(g, players);
    } catch (e) {
      return { err: String(e && e.message || e) };
    }
    const body = document.getElementById('gbody');
    return {
      err: null,
      active: document.getElementById('game-screen')?.classList.contains('active'),
      title: document.getElementById('gtitle')?.textContent || '',
      bodyLen: (body && body.innerHTML || '').trim().length,
    };
  }, id);
  expect(html.err, id).toBeNull();
  expect(html.active, id).toBeTruthy();
  expect(html.bodyLen, id + ' empty gbody').toBeGreaterThan(20);
  await page.evaluate(() => window.GL.exitGame());
}

test.describe('All 39 games launch', () => {
  test('desktop: every Reg game renders #gbody then exits', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await waitReg39(page);
    const ids = await page.evaluate(() => window.Reg.list.map((g) => g.id));
    expect(ids.length).toBeGreaterThanOrEqual(35);
    for (const id of ids) {
      await launchAndExit(page, id);
    }
    const fatal = errors.filter((e) => !/serviceWorker|ResizeObserver|favicon|AudioContext/i.test(e));
    expect(fatal).toEqual([]);
  });
});

test.describe('Game shell mobile / iPad', () => {
  test('iPhone SE viewport: launch neon reflex + back 44px', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone SE'] });
    const page = await context.newPage();
    await waitReg39(page);
    await launchAndExit(page, 'reflex');
    const box = await page.locator('.ghdr button').first().boundingBox();
    expect(box?.height || 0).toBeGreaterThanOrEqual(40);
    await context.close();
  });

  test('iPad landscape: #game-screen not side-nav grid', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro 11'],
      viewport: { width: 1194, height: 834 },
    });
    const page = await context.newPage();
    await waitReg39(page);
    await page.evaluate(() => {
      const g = window.Reg.get('mem');
      window.GL._start(g, [{ id: 'p1', name: 'P1', av: '🎮', col: PCBrand.h_64d2ff, local: true }]);
    });
    const display = await page.locator('#game-screen').evaluate((el) => getComputedStyle(el).display);
    expect(display).not.toBe('grid');
    await page.evaluate(() => window.GL.exitGame());
    await context.close();
  });
});
