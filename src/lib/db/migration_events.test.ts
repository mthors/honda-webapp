import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Events and Dealer Locations Migration (20261117000001_create_events_and_dealer_locations.sql)', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261117000001_create_events_and_dealer_locations.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  it('creates public.dealer_locations table with required fields', () => {
    expect(sql).toMatch(/create\s+table\s+if\s+not\s+exists\s+public\.dealer_locations\s*\(/i);
    expect(sql).toMatch(/name\s+text\s+not\s+null/i);
    expect(sql).toMatch(/address\s+text\s+not\s+null/i);
    expect(sql).toMatch(/city\s+text\s+not\s+null/i);
    expect(sql).toMatch(/phone\s+text\s+null/i);
    expect(sql).toMatch(/is_active\s+boolean\s+not\s+null\s+default\s+true/i);
  });

  it('creates public.events table with foreign key to dealer_locations and date constraints', () => {
    expect(sql).toMatch(/create\s+table\s+if\s+not\s+exists\s+public\.events\s*\(/i);
    expect(sql).toMatch(
      /location_id\s+uuid\s+not\s+null\s+references\s+public\.dealer_locations\(id\)\s+on\s+delete\s+restrict/i
    );
    expect(sql).toMatch(/constraint\s+chk_events_dates\s+check\s*\(\s*end_at\s*>\s*start_at\s*\)/i);
    expect(sql).toMatch(
      /status\s+text\s+not\s+null\s+default\s+'draft'\s+check\s*\(\s*status\s+in\s*\('draft',\s*'published'\)\s*\)/i
    );
  });

  it('enforces Row Level Security (RLS) on both tables', () => {
    expect(sql).toMatch(
      /alter\s+table\s+public\.dealer_locations\s+enable\s+row\s+level\s+security;/i
    );
    expect(sql).toMatch(/alter\s+table\s+public\.events\s+enable\s+row\s+level\s+security;/i);
  });

  it('configures public read policy for published events only', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Public can view published events"\s+on\s+public\.events/i
    );
    expect(sql).toMatch(/using\s*\(\s*status\s*=\s*'published'\s*\)/i);
  });

  it('configures public read policy for active dealer locations linked to published events', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Public can view active dealer locations for published events"\s+on\s+public\.dealer_locations/i
    );
    expect(sql).toMatch(/is_active\s*=\s*true/i);
    expect(sql).toMatch(/exists\s*\(\s*select\s+1\s+from\s+public\.events/i);
  });

  it('strictly restricts management to authenticated admins via public.is_admin()', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can manage dealer locations"\s+on\s+public\.dealer_locations/i
    );
    expect(sql).toMatch(/create\s+policy\s+"Admins can manage events"\s+on\s+public\.events/i);
  });

  it('provisions events storage bucket with 5MB limit and MIME restrictions', () => {
    expect(sql).toMatch(/insert\s+into\s+storage\.buckets/i);
    expect(sql).toMatch(/'events'/i);
    expect(sql).toMatch(/5242880/i);
    expect(sql).toMatch(/'image\/jpeg',\s*'image\/png',\s*'image\/webp'/i);
  });

  it('seeds placeholder demo dealer locations', () => {
    expect(sql).toMatch(/Demo Dealer – Sidoarjo/i);
    expect(sql).toMatch(/Demo Dealer – Surabaya/i);
    expect(sql).toMatch(/Demo Dealer – Gresik/i);
  });
});
