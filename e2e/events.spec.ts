import { test, expect } from '@playwright/test';

test.describe('Event Calendar & Management E2E Tests', () => {
  test('public event calendar page loads with calendar view and upcoming events', async ({
    page,
  }) => {
    await page.goto('/events');

    // 1. Verify Page Title and Header
    await expect(page).toHaveTitle(/Agenda Kegiatan & Acara/);
    await expect(page.locator('h1')).toContainText('Agenda Kegiatan & Acara');
    await expect(page.getByText('Agenda Dealer Resmi')).toBeVisible();

    // 2. Verify Breadcrumb
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Beranda');
    await expect(breadcrumb).toContainText('Agenda Kegiatan');

    // 3. Verify Calendar Grid and Month Navigation
    const nextBtn = page.getByRole('button', { name: 'Bulan berikutnya' });
    const prevBtn = page.getByRole('button', { name: 'Bulan sebelumnya' });
    await expect(nextBtn).toBeVisible();
    await expect(prevBtn).toBeVisible();

    const monthHeading = page.locator('h2').first();
    await expect(monthHeading).toBeVisible();
    const initialMonth = await monthHeading.textContent();
    expect(initialMonth).toBeTruthy();

    // Click Next Month
    await nextBtn.click();
    const nextMonth = await monthHeading.textContent();
    expect(nextMonth).not.toBe(initialMonth);

    // Click Previous Month twice to go back
    await prevBtn.click();
    await prevBtn.click();
    const prevMonth = await monthHeading.textContent();
    expect(prevMonth).not.toBe(initialMonth);
    expect(prevMonth).not.toBe(nextMonth);

    // 4. Verify Upcoming Events Section
    const upcomingSection = page.locator('section[aria-labelledby="upcoming-events-title"]');
    if ((await upcomingSection.count()) > 0) {
      await expect(upcomingSection).toBeVisible();
      await expect(upcomingSection.locator('h2')).toContainText('Acara Mendatang');
    }
  });

  test('public header and mobile navigation include Agenda Kegiatan link', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/');

    if (!isMobile) {
      // Desktop Header Navigation: click 'Promo & Agenda' dropdown trigger
      const promoAgendaDropdown = page.locator('header nav button', { hasText: 'Promo & Agenda' });
      await expect(promoAgendaDropdown).toBeVisible();
      await promoAgendaDropdown.click();

      const desktopLink = page.locator('header nav a[href="/events"]').first();
      await expect(desktopLink).toBeVisible();
      await expect(desktopLink).toContainText('Agenda Kegiatan');
    } else {
      // Mobile Drawer Navigation: open mobile drawer and expand accordion
      const mobileToggle = page.locator('#mobile-menu-toggle');
      await expect(mobileToggle).toBeVisible();
      await mobileToggle.click();

      const promoAgendaAccordion = page.locator('#mobile-navigation button', {
        hasText: 'Promo & Agenda',
      });
      await expect(promoAgendaAccordion).toBeVisible();
      await promoAgendaAccordion.click();

      const mobileLink = page.locator('#mobile-navigation a[href="/events"]');
      await expect(mobileLink).toBeVisible();
      await expect(mobileLink).toContainText('Agenda Kegiatan');
    }
  });

  test('public footer includes Agenda Kegiatan quick link', async ({ page }) => {
    await page.goto('/');

    const footerLink = page.locator('footer a[href="/events"]');
    await expect(footerLink).toBeVisible();
    await expect(footerLink).toContainText('Agenda Kegiatan');
  });

  test('non-existent event slug returns 404 not found page', async ({ page }) => {
    const res = await page.goto('/events/non-existent-event-slug-12345');
    // Next.js returns 404 status for notFound()
    expect(res?.status()).toBe(404);
    await expect(page.locator('body')).toContainText(
      /tidak ditemukan|halaman tidak ditemukan|404/i
    );
  });

  test('unauthenticated visitor attempting to access admin event routes is redirected to login', async ({
    page,
  }) => {
    // Attempt /admin/events
    await page.goto('/admin/events');
    await page.waitForURL('**/admin/login**');
    expect(page.url()).toContain('/admin/login');

    // Attempt /admin/dealerships (canonical branch management)
    await page.goto('/admin/dealerships');
    await page.waitForURL('**/admin/login**');
    expect(page.url()).toContain('/admin/login');
  });
});
