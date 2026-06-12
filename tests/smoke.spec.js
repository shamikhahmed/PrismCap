// @ts-check
import { test, expect } from '@playwright/test';

test.describe('PrismCap smoke', () => {
  test('loads shell without fatal errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/?e2e=1');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(1200);
    const fatal = errors.filter(e => !/serviceWorker|ResizeObserver|favicon/i.test(e));
    expect(fatal).toEqual([]);
  });

  test('manifest link present', async ({ page }) => {
    await page.goto('/?e2e=1');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  });

  test('Nav.go switches to library screen', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/?e2e=1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => typeof window.Nav !== 'undefined' && typeof window.Nav.go === 'function');
    await page.evaluate(() => window.Nav.go('library'));
    await expect(page.locator('#library-screen.active')).toBeVisible();
    await page.evaluate(() => window.Nav.go('arcade'));
    await expect(page.locator('#arcade-screen.active')).toBeVisible();
    const fatal = errors.filter(e => !/serviceWorker|ResizeObserver|favicon/i.test(e));
    expect(fatal).toEqual([]);
  });
});
