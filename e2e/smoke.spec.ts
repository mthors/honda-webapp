import { test, expect } from '@playwright/test';

test.describe('Showroom Smoke Tests', () => {
  test('homepage displays dealer identity and navigation', async ({ page }) => {
    await page.goto('/');

    // Check header and dealer name
    await expect(page.locator('header')).toContainText('HONDA');
    await expect(page.locator('header')).toContainText('MEGA PERSADA MANDIRI');

    // Check primary CTA button
    const ctaButton = page.locator('button', { hasText: 'Hubungi Sales' });
    await expect(ctaButton.first()).toBeVisible();
  });
});
