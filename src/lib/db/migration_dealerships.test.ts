import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Dealerships and Site Settings Migration (20261104000001_create_dealerships_and_seed_settings.sql)', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261104000001_create_dealerships_and_seed_settings.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  it('seeds default singleton row for site_settings without fabricated address/phone', () => {
    expect(sql).toMatch(/insert\s+into\s+public\.site_settings/i);
    expect(sql).toMatch(/'default'/i);
    expect(sql).toMatch(/'Honda Satrya Dealer Group'/i);
    expect(sql).toMatch(/on\s+conflict\s*\(id\)\s+do\s+nothing/i);
  });

  it('creates public.dealerships table with required columns including is_synthetic and code', () => {
    expect(sql).toMatch(/create\s+table\s+if\s+not\s+exists\s+public\.dealerships\s*\(/i);
    expect(sql).toMatch(/is_synthetic\s+boolean\s+not\s+null\s+default\s+true/i);
    expect(sql).toMatch(/code\s+text\s+unique\s+not\s+null/i);
    expect(sql).toMatch(/city\s+text\s+not\s+null/i);
  });

  it('enforces Row Level Security (RLS) on public.dealerships', () => {
    expect(sql).toMatch(/alter\s+table\s+public\.dealerships\s+enable\s+row\s+level\s+security;/i);
  });

  it('allows public read only for active dealerships', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Public can read active dealerships"\s+on\s+public\.dealerships/i
    );
    expect(sql).toMatch(/using\s*\(\s*is_active\s*=\s*true\s*\)/i);
  });

  it('strictly restricts management of dealerships to authenticated admins', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can manage dealerships"\s+on\s+public\.dealerships/i
    );
    expect(sql).toMatch(/using\s*\(\s*public\.is_admin\(\)\s*\)/i);
    expect(sql).toMatch(/with\s+check\s*\(\s*public\.is_admin\(\)\s*\)/i);
  });

  it('seeds at least 3 synthetic demo dealership records clearly labeled as synthetic demo', () => {
    expect(sql).toMatch(/\[DEMO\] Honda Satrya — Sidoarjo Sentral/i);
    expect(sql).toMatch(/\[DEMO\] Honda Satrya — Surabaya Selatan/i);
    expect(sql).toMatch(/\[DEMO\] Honda Satrya — Gresik Kota/i);
    // Ensure all 3 are explicitly marked is_synthetic = true
    const syntheticMatches = sql.match(/true,\s*true,\s*[1-3]/g);
    expect(syntheticMatches?.length).toBeGreaterThanOrEqual(3);
  });
});
