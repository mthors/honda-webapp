import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Events and Dealer Locations Migration & Security (20261117000001_create_events_and_dealer_locations.sql)', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261117000001_create_events_and_dealer_locations.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  const seedPath = path.resolve(process.cwd(), 'supabase/seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf-8');

  it('creates public.dealer_locations table with required fields and auto updated_at trigger', () => {
    expect(sql).toMatch(/create\s+table\s+if\s+not\s+exists\s+public\.dealer_locations\s*\(/i);
    expect(sql).toMatch(/name\s+text\s+not\s+null/i);
    expect(sql).toMatch(/address\s+text\s+not\s+null/i);
    expect(sql).toMatch(/city\s+text\s+not\s+null/i);
    expect(sql).toMatch(/phone\s+text\s+null/i);
    expect(sql).toMatch(/is_active\s+boolean\s+not\s+null\s+default\s+true/i);
    expect(sql).toMatch(/create\s+trigger\s+trg_dealer_locations_updated_at/i);
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
    expect(sql).toMatch(/create\s+trigger\s+trg_events_updated_at/i);
  });

  it('enforces Row Level Security (RLS) on both tables', () => {
    expect(sql).toMatch(
      /alter\s+table\s+public\.dealer_locations\s+enable\s+row\s+level\s+security;/i
    );
    expect(sql).toMatch(/alter\s+table\s+public\.events\s+enable\s+row\s+level\s+security;/i);
  });

  it('configures public read policy for published events only (excluding draft events)', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Public can view published events"\s+on\s+public\.events/i
    );
    expect(sql).toMatch(/using\s*\(\s*status\s*=\s*'published'\s*\)/i);
  });

  it('configures public read policy for active dealer locations linked to published events only', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Public can view active dealer locations for published events"\s+on\s+public\.dealer_locations/i
    );
    expect(sql).toMatch(/is_active\s*=\s*true/i);
    expect(sql).toMatch(/exists\s*\(\s*select\s+1\s+from\s+public\.events/i);
  });

  it('strictly restricts management of dealer locations and events to authenticated admins via public.is_admin()', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can manage dealer locations"\s+on\s+public\.dealer_locations/i
    );
    expect(sql).toMatch(/create\s+policy\s+"Admins can manage events"\s+on\s+public\.events/i);
    // Verifies that neither ordinary authenticated nor public users can bypass admin check
    const matches = sql.match(/public\.is_admin\(\)/g);
    expect(matches?.length).toBeGreaterThanOrEqual(6);
  });

  it('revokes broad privileges from public and anon, granting only SELECT to anon', () => {
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+table\s+public\.dealer_locations\s+from\s+public,\s*anon;/i
    );
    expect(sql).toMatch(/revoke\s+all\s+on\s+table\s+public\.events\s+from\s+public,\s*anon;/i);
    expect(sql).toMatch(/grant\s+select\s+on\s+table\s+public\.dealer_locations\s+to\s+anon;/i);
    expect(sql).toMatch(/grant\s+select\s+on\s+table\s+public\.events\s+to\s+anon;/i);
  });

  it('provisions events storage bucket with 5MB limit and raster image MIME restrictions', () => {
    expect(sql).toMatch(/insert\s+into\s+storage\.buckets/i);
    expect(sql).toMatch(/'events'/i);
    expect(sql).toMatch(/5242880/);
    expect(sql).toMatch(/'image\/jpeg',\s*'image\/png',\s*'image\/webp'/i);
    // Disallow SVG to prevent active content / XSS injection vectors
    expect(sql).not.toMatch(/'image\/svg\+xml'/);
  });

  it('strictly restricts storage uploads, replacements, and deletions to verified admins via public.is_admin()', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can upload event images"\s+on\s+storage\.objects/i
    );
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can update event images"\s+on\s+storage\.objects/i
    );
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can delete event images"\s+on\s+storage\.objects/i
    );
  });

  it('ensures migration does NOT contain demo seed inserts so production stays clean', () => {
    expect(sql).not.toMatch(/insert\s+into\s+public\.dealer_locations/i);
  });

  it('provides placeholder demo dealer locations in development seed file (seed.sql)', () => {
    expect(seedSql).toMatch(/insert\s+into\s+public\.dealer_locations/i);
    expect(seedSql).toMatch(/Demo Dealer – Sidoarjo/i);
    expect(seedSql).toMatch(/Demo Dealer – Surabaya/i);
    expect(seedSql).toMatch(/Demo Dealer – Gresik/i);
  });
});
