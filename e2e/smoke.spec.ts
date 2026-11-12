import { test, expect } from '@playwright/test';

test.describe('Showroom Smoke Tests', () => {
  test('homepage displays dealer identity, header, and footer', async ({ page }) => {
    await page.goto('/');

    // Check header and dealer name
    await expect(page.locator('header')).toContainText('HONDA');
    await expect(page.locator('header')).toContainText('SATRYA DEALER GROUP');

    // Check primary CTA button
    const ctaButton = page.getByRole('button', { name: 'Lihat Semua Motor', exact: true });
    await expect(ctaButton).toBeVisible();

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

  test('motorcycle catalog page loads with category filters and search', async ({ page }) => {
    await page.goto('/motor');

    // Check heading
    await expect(page.locator('h1')).toContainText('Katalog Sepeda Motor Honda');

    // Check search input exists
    const searchInput = page.locator('#catalog-search');
    await expect(searchInput).toBeVisible();

    // Check category filter tablist exists
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();
    await expect(tablist).toContainText('Semua Kategori');

    // Check corporate disclaimer in footer band
    await expect(
      page.locator('text=bukan website resmi korporat PT Astra Honda Motor').first()
    ).toBeVisible();
  });

  test('public contact and inquiry page loads with customer inquiry form', async ({ page }) => {
    await page.goto('/hubungi');

    // Check heading and form title
    await expect(page.locator('h1')).toContainText('Hubungi Dealer Kami');
    await expect(page.locator('h2').first()).toContainText('Konsultasi Pembelian');

    // Check key form controls
    await expect(page.getByLabel('Nama Lengkap *')).toBeVisible();
    await expect(page.getByLabel('Nomor WhatsApp *')).toBeVisible();
    await expect(page.getByLabel('Kota / Kabupaten Domisili *')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kirim Pertanyaan' })).toBeVisible();

    // Check WhatsApp contact card and dealership operating hours
    await expect(page.locator('text=Layanan WhatsApp Sales')).toBeVisible();
    await expect(page.locator('text=Lokasi Dealer & Showroom').first()).toBeVisible();
  });

  test('submits customer inquiry form with all fields filled successfully', async ({ page }) => {
    await page.goto('/hubungi');

    const randomPhone = `0812345${Math.floor(10000 + Math.random() * 90000)}`;

    // Fill all form inputs
    await page.locator('#inquiry-full-name').fill('Budi Santoso');
    await page.locator('#inquiry-whatsapp').fill(randomPhone);
    await page.locator('#inquiry-email').fill('budi.santoso@example.com');
    await page.locator('#inquiry-city').fill('Sidoarjo');
    await page.locator('#inquiry-district').fill('Waru');

    // Select motorcycle model
    const modelSelect = page.locator('#inquiry-model');
    await modelSelect.selectOption({ index: 1 });

    // Wait for variant select to be enabled and select first variant
    const variantSelect = page.locator('#inquiry-variant');
    await expect(variantSelect).toBeEnabled();
    await variantSelect.selectOption({ index: 1 });

    // Wait for color select to be enabled and select first color
    const colorSelect = page.locator('#inquiry-color');
    await expect(colorSelect).toBeEnabled();
    await colorSelect.selectOption({ index: 1 });

    // Fill message
    await page
      .locator('#inquiry-message')
      .fill('Halo, saya ingin menanyakan ketersediaan unit motor ini.');

    // Check privacy consent
    await page.locator('input[type="checkbox"]').check();

    // Click submit
    const submitBtn = page.getByRole('button', { name: 'Kirim Pertanyaan' });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify success confirmation view and reference code
    await expect(page.locator('text=Pertanyaan Anda Berhasil Terkirim')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=INQ-')).toBeVisible();
    await expect(page.locator('text=Lanjutkan Obrolan via WhatsApp')).toBeVisible();
  });

  test('promotional banner progress indicator fills over time and pauses on hover', async ({
    page,
  }) => {
    await page.goto('/');

    const fill = page.locator('[data-testid="banner-progress-fill"]');
    if ((await fill.count()) > 0) {
      // Helper to extract scaleX from CSS matrix
      const getScaleX = async () => {
        const transform = await fill.evaluate((el) => window.getComputedStyle(el).transform);
        if (!transform || transform === 'none') return 0;
        const match = transform.match(/matrix\(([^,]+)/);
        return match ? parseFloat(match[1]) : 0;
      };

      // Progress begins near 0
      const initialScale = await getScaleX();
      expect(initialScale).toBeLessThan(0.5);

      // Advances over 1.5s
      await page.waitForTimeout(1500);
      const midScale = await getScaleX();
      expect(midScale).toBeGreaterThan(initialScale);
      expect(midScale).toBeGreaterThanOrEqual(0.15);

      // Pauses when hovered
      const section = page.locator('section[aria-label^="Spanduk Promosi"]');
      await section.hover();
      const playStateHover = await fill.evaluate(
        (el) => window.getComputedStyle(el).animationPlayState
      );
      expect(playStateHover).toBe('paused');

      const scaleAtHover = await getScaleX();
      await page.waitForTimeout(1000);
      const scaleAfterHoverWait = await getScaleX();
      // Frozen while hovered (difference within small float tolerance)
      expect(Math.abs(scaleAfterHoverWait - scaleAtHover)).toBeLessThan(0.05);

      // Resumes when unhovered
      await page.mouse.move(0, 0);
      await page.waitForTimeout(100);
      const playStateUnhover = await fill.evaluate(
        (el) => window.getComputedStyle(el).animationPlayState
      );
      expect(playStateUnhover).toBe('running');
    }
  });

  test('promotional banner progress indicator resets on every slide transition and completes one cycle per autoplay interval', async ({
    page,
  }) => {
    await page.goto('/');

    const fill = page.locator('[data-testid="banner-progress-fill"]');
    if ((await fill.count()) > 0) {
      const getScaleX = async () => {
        const transform = await fill.evaluate((el) => window.getComputedStyle(el).transform);
        if (!transform || transform === 'none') return 0;
        const match = transform.match(/matrix\(([^,]+)/);
        return match ? parseFloat(match[1]) : 0;
      };

      const getActiveTab = async () => {
        return await page.locator('[role="tab"][aria-selected="true"]').getAttribute('aria-label');
      };

      // Reset to a clean slide cycle
      const nextBtn = page.getByRole('button', { name: 'Spanduk berikutnya' });
      await nextBtn.click();
      await page.mouse.move(0, 0);
      await page.locator('body').click();
      await page.waitForTimeout(100);

      // 1. Initial slide starts near 0
      const currentTab = await getActiveTab();
      const initialScale = await getScaleX();
      expect(initialScale).toBeLessThan(0.25);

      // 2. Progresses steadily over time towards 100%
      await page.waitForTimeout(2000);
      const midScale = await getScaleX();
      expect(midScale).toBeGreaterThan(initialScale);
      expect(midScale).toBeGreaterThanOrEqual(0.2);

      // 3. Completes cycle and advances to the next slide (~5s interval + 550ms transition)
      // Wait for tab selection to change to next slide
      await expect(page.locator('[role="tab"][aria-selected="true"]')).not.toHaveAttribute(
        'aria-label',
        currentTab || '',
        { timeout: 7000 }
      );

      // 4. Verify progress bar resets back near 0 for the new slide
      const newSlideScale = await getScaleX();
      expect(newSlideScale).toBeLessThan(0.35);

      // 5. Verify manual slide transition (Next button click) also resets progress bar
      await nextBtn.click();
      await page.mouse.move(0, 0);
      await page.locator('body').click();
      await page.waitForTimeout(100);

      const manualSlideScale = await getScaleX();
      expect(manualSlideScale).toBeLessThan(0.35);
    }
  });
});
