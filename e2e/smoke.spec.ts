import { test, expect } from '@playwright/test';

test.describe('Showroom Smoke Tests', () => {
  test('homepage displays dealer identity, header, and footer', async ({ page }) => {
    await page.goto('/');

    // Check header and dealer name
    await expect(page.locator('header')).toContainText('HONDA');
    await expect(page.locator('header')).toContainText('SATRYA DEALER GROUP');

    // Check primary CTA button
    const ctaButton = page.locator('button', { hasText: 'Hubungi Sales' });
    await expect(ctaButton.first()).toBeVisible();

    // Check footer disclaimer
    const footer = page.locator('footer');
    await expect(footer).toContainText('Honda Satrya Dealer Group');
    await expect(footer).toContainText('bukan website resmi korporat PT Astra Honda Motor');
  });

  test('mobile navigation drawer opens and closes properly', async ({ page }) => {
    // Set mobile viewport 375px
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const toggleButton = page.locator('#mobile-menu-toggle');
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Open mobile menu
    await toggleButton.click();
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // Check mobile navigation links are visible
    const mobileNav = page.locator('#mobile-navigation');
    await expect(mobileNav).toContainText('Sepeda Motor');
    await expect(mobileNav).toContainText('Daftar Harga');

    // Close mobile menu
    await toggleButton.click();
    await expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });
});
