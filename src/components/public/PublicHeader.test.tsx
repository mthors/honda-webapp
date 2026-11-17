import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PublicHeader } from './PublicHeader';
import type { SiteSettings } from '@/types/settings';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('PublicHeader component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the dealership logo and identity text with default fallback', () => {
    render(<PublicHeader />);
    const dealerName = screen.getByText('HONDA');
    expect(dealerName).toBeInTheDocument();
    expect(screen.getByText('SATRYA DEALER GROUP')).toBeInTheDocument();
  });

  it('renders configured dealer name when settings prop is provided', () => {
    const mockSettings: SiteSettings = {
      id: 'default',
      dealerName: 'Honda Satrya Utama',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '6281299990000',
      publicEmail: 'kontak@satrya.id',
      openingHours: {},
      socialLinks: {},
      privacyNotice: 'Kebijakan privasi',
      updatedBy: null,
      updatedAt: '2026-11-04T00:00:00Z',
    };

    render(<PublicHeader settings={mockSettings} />);
    expect(screen.getByText('HONDA')).toBeInTheDocument();
    expect(screen.getByText('SATRYA UTAMA')).toBeInTheDocument();
  });

  it('constructs safe WhatsApp link when configured in settings', () => {
    const mockSettings: SiteSettings = {
      id: 'default',
      dealerName: 'Honda Satrya Dealer Group',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '0812-3456-7890',
      publicEmail: null,
      openingHours: {},
      socialLinks: {},
      privacyNotice: 'Kebijakan privasi',
      updatedBy: null,
      updatedAt: '2026-11-04T00:00:00Z',
    };

    render(<PublicHeader settings={mockSettings} />);
    const contactLinks = screen.getAllByRole('link', { name: /Hubungi Sales/i });
    const waLink = contactLinks.find((l) => l.getAttribute('href')?.includes('wa.me'));
    expect(waLink).toBeDefined();
    // Normalized to international 628... format without leading zero
    expect(waLink?.getAttribute('href')).toContain('wa.me/6281234567890');
  });

  it('normalizes +62 and 08 phone numbers to 628... for WhatsApp universal links', () => {
    const mockSettings: SiteSettings = {
      id: 'default',
      dealerName: 'Honda Satrya Group',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '+62 857-1122-3344',
      publicEmail: null,
      openingHours: {},
      socialLinks: {},
      privacyNotice: 'Privasi',
      updatedBy: null,
      updatedAt: '2026-11-04T00:00:00Z',
    };

    render(<PublicHeader settings={mockSettings} />);
    const contactLinks = screen.getAllByRole('link', { name: /Hubungi Sales/i });
    const waLink = contactLinks.find((l) => l.getAttribute('href')?.includes('wa.me'));
    expect(waLink).toBeDefined();
    expect(waLink?.getAttribute('href')).toContain('wa.me/6285711223344');
  });

  it('falls back to /hubungi internal link when WhatsApp number is missing or invalid', () => {
    const originalEnv = process.env.NEXT_PUBLIC_DEALER_WHATSAPP;
    delete process.env.NEXT_PUBLIC_DEALER_WHATSAPP;

    const mockSettings: SiteSettings = {
      id: 'default',
      dealerName: 'Honda Satrya Dealer Group',
      logoPath: null,
      address: null,
      city: null,
      phone: null,
      whatsappNumber: '', // empty
      publicEmail: null,
      openingHours: {},
      socialLinks: {},
      privacyNotice: 'Kebijakan privasi',
      updatedBy: null,
      updatedAt: '2026-11-04T00:00:00Z',
    };

    render(<PublicHeader settings={mockSettings} />);
    const contactLinks = screen.getAllByRole('link', { name: /Hubungi Sales/i });
    for (const link of contactLinks) {
      expect(link).toHaveAttribute('href', '/hubungi');
    }

    process.env.NEXT_PUBLIC_DEALER_WHATSAPP = originalEnv;
  });

  it('renders desktop navigation with direct links and consolidated dropdowns', () => {
    render(<PublicHeader />);
    const desktopNav = screen.getByRole('navigation', { name: 'Navigasi Utama' });
    expect(desktopNav).toBeInTheDocument();

    // 1. Beranda
    const homeLink = within(desktopNav).getByRole('link', { name: 'Beranda' });
    expect(homeLink).toHaveAttribute('href', '/');

    // 2. Sepeda Motor Dropdown trigger
    const motorDropdownBtn = within(desktopNav).getByRole('button', { name: /Sepeda Motor/i });
    expect(motorDropdownBtn).toBeInTheDocument();
    expect(motorDropdownBtn).toHaveAttribute('aria-expanded', 'false');

    // 3. Promo & Agenda Dropdown trigger
    const promoAgendaDropdownBtn = within(desktopNav).getByRole('button', {
      name: /Promo & Agenda/i,
    });
    expect(promoAgendaDropdownBtn).toBeInTheDocument();
    expect(promoAgendaDropdownBtn).toHaveAttribute('aria-expanded', 'false');

    // 4. Tentang & Kontak
    const hubungiLink = within(desktopNav).getByRole('link', { name: 'Tentang & Kontak' });
    expect(hubungiLink).toHaveAttribute('href', '/hubungi');
  });

  it('opens and closes desktop dropdowns on click, outside click, and Escape key', () => {
    render(<PublicHeader />);
    const desktopNav = screen.getByRole('navigation', { name: 'Navigasi Utama' });

    // Open Sepeda Motor dropdown
    const motorDropdownBtn = within(desktopNav).getByRole('button', { name: /Sepeda Motor/i });
    fireEvent.click(motorDropdownBtn);
    expect(motorDropdownBtn).toHaveAttribute('aria-expanded', 'true');

    // Verify Sepeda Motor menu items
    const motorMenu = within(desktopNav).getByRole('menu', { name: 'Sepeda Motor' });
    const catalogLink = within(motorMenu).getByRole('menuitem', { name: 'Daftar Motor' });
    const priceListLink = within(motorMenu).getByRole('menuitem', { name: 'Daftar Harga' });
    expect(catalogLink).toHaveAttribute('href', '/motor');
    expect(priceListLink).toHaveAttribute('href', '/harga');

    // Click outside closes dropdown
    fireEvent.mouseDown(document.body);
    expect(motorDropdownBtn).toHaveAttribute('aria-expanded', 'false');
    expect(
      within(desktopNav).queryByRole('menu', { name: 'Sepeda Motor' })
    ).not.toBeInTheDocument();

    // Open Promo & Agenda dropdown
    const promoAgendaBtn = within(desktopNav).getByRole('button', { name: /Promo & Agenda/i });
    fireEvent.click(promoAgendaBtn);
    expect(promoAgendaBtn).toHaveAttribute('aria-expanded', 'true');

    // Verify Promo & Agenda menu items
    const promoMenu = within(desktopNav).getByRole('menu', { name: 'Promo & Agenda' });
    const promoLink = within(promoMenu).getByRole('menuitem', { name: 'Promo' });
    const eventsLink = within(promoMenu).getByRole('menuitem', { name: 'Agenda Kegiatan' });
    expect(promoLink).toHaveAttribute('href', '/promo');
    expect(eventsLink).toHaveAttribute('href', '/events');

    // Press Escape closes dropdown
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(promoAgendaBtn).toHaveAttribute('aria-expanded', 'false');
    expect(
      within(desktopNav).queryByRole('menu', { name: 'Promo & Agenda' })
    ).not.toBeInTheDocument();
  });

  it('opens desktop dropdown on hover and closes after intentional closing delay', () => {
    vi.useFakeTimers();
    render(<PublicHeader />);
    const desktopNav = screen.getByRole('navigation', { name: 'Navigasi Utama' });
    const motorDropdownBtn = within(desktopNav).getByRole('button', { name: /Sepeda Motor/i });
    const motorContainer = motorDropdownBtn.closest('div.relative');
    expect(motorContainer).toBeTruthy();

    // Mouse enter opens dropdown immediately
    act(() => {
      fireEvent.mouseEnter(motorContainer!);
    });
    expect(motorDropdownBtn).toHaveAttribute('aria-expanded', 'true');
    expect(within(desktopNav).getByRole('menu', { name: 'Sepeda Motor' })).toBeInTheDocument();

    // Mouse leave initiates closing delay
    act(() => {
      fireEvent.mouseLeave(motorContainer!);
    });
    // Still open before 180ms delay elapses
    expect(motorDropdownBtn).toHaveAttribute('aria-expanded', 'true');

    // Advance by 100ms: still open
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(motorDropdownBtn).toHaveAttribute('aria-expanded', 'true');

    // Advance past 180ms: now closed
    act(() => {
      vi.advanceTimersByTime(90);
    });
    expect(motorDropdownBtn).toHaveAttribute('aria-expanded', 'false');
    expect(
      within(desktopNav).queryByRole('menu', { name: 'Sepeda Motor' })
    ).not.toBeInTheDocument();
  });

  it('prevents accidental closing when moving pointer between trigger and menu (flicker-free tunnel)', () => {
    vi.useFakeTimers();
    render(<PublicHeader />);
    const desktopNav = screen.getByRole('navigation', { name: 'Navigasi Utama' });
    const promoAgendaBtn = within(desktopNav).getByRole('button', { name: /Promo & Agenda/i });
    const promoContainer = promoAgendaBtn.closest('div.relative');
    expect(promoContainer).toBeTruthy();

    // Hover to open
    act(() => {
      fireEvent.mouseEnter(promoContainer!);
    });
    expect(promoAgendaBtn).toHaveAttribute('aria-expanded', 'true');

    // Pointer leaves briefly (e.g. crossing edge)
    act(() => {
      fireEvent.mouseLeave(promoContainer!);
      vi.advanceTimersByTime(80); // within the 180ms delay
      // Pointer re-enters
      fireEvent.mouseEnter(promoContainer!);
    });

    // Advance past original timer time
    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Dropdown must remain open without closing or flickering
    expect(promoAgendaBtn).toHaveAttribute('aria-expanded', 'true');
    expect(within(desktopNav).getByRole('menu', { name: 'Promo & Agenda' })).toBeInTheDocument();
  });

  it('supports opening and closing the mobile menu with proper accessibility attributes', () => {
    render(<PublicHeader />);
    const toggleButton = screen.getByRole('button', { name: /Buka menu navigasi/i });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(toggleButton).toHaveAttribute('aria-controls', 'mobile-navigation');

    // Click to open
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Tutup menu navigasi/i })).toBeInTheDocument();

    // Click to close
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /Buka menu navigasi/i })).toBeInTheDocument();
  });

  it('expands accordion sections in mobile drawer and closes on link navigation', () => {
    render(<PublicHeader />);
    const toggleButton = screen.getByRole('button', { name: /Buka menu navigasi/i });
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    const mobileNavRegion = screen.getByRole('region', { name: 'Menu Navigasi Mobile' });

    // Expand Sepeda Motor accordion
    const motorAccordionBtn = within(mobileNavRegion).getByRole('button', {
      name: /Sepeda Motor/i,
    });
    fireEvent.click(motorAccordionBtn);

    const motorLink = within(mobileNavRegion).getByRole('link', { name: 'Daftar Motor' });
    expect(motorLink).toHaveAttribute('href', '/motor');

    // Clicking child link closes mobile drawer
    fireEvent.click(motorLink);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands Promo & Agenda accordion section in mobile drawer and displays child links with readable light background', () => {
    render(<PublicHeader />);
    const toggleButton = screen.getByRole('button', { name: /Buka menu navigasi/i });
    fireEvent.click(toggleButton);

    const mobileNavRegion = screen.getByRole('region', { name: 'Menu Navigasi Mobile' });

    // Expand Promo & Agenda accordion
    const promoAccordionBtn = within(mobileNavRegion).getByRole('button', {
      name: /Promo & Agenda/i,
    });
    fireEvent.click(promoAccordionBtn);

    const promoLink = within(mobileNavRegion).getByRole('link', { name: 'Promo' });
    const eventsLink = within(mobileNavRegion).getByRole('link', { name: 'Agenda Kegiatan' });
    expect(promoLink).toHaveAttribute('href', '/promo');
    expect(eventsLink).toHaveAttribute('href', '/events');

    // Confirm that the accordion panel uses neutral-2/40 light surface, NOT black neutral-1
    const accordionPanel = promoLink.closest('div');
    expect(accordionPanel?.className).toContain('bg-neutral-2/40');
    expect(accordionPanel?.className).not.toContain('bg-neutral-1');
  });

  it('closes mobile menu when the Escape key is pressed', () => {
    render(<PublicHeader />);
    const toggleButton = screen.getByRole('button', { name: /Buka menu navigasi/i });
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });
});
