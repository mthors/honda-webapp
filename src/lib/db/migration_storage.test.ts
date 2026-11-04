import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Storage Buckets & RLS Migration (20261104000002_provision_storage_buckets_and_rls.sql)', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261104000002_provision_storage_buckets_and_rls.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  it('provisions the 3 public showroom buckets: motorcycles, promotions, hero-banners', () => {
    expect(sql).toMatch(/insert\s+into\s+storage\.buckets/i);
    expect(sql).toMatch(/'motorcycles'/i);
    expect(sql).toMatch(/'promotions'/i);
    expect(sql).toMatch(/'hero-banners'/i);
    expect(sql).toMatch(/on\s+conflict\s*\(id\)\s+do\s+update/i);
  });

  it('configures public read access, 5MB file size limit, and raster-only image MIME types (excluding active SVG)', () => {
    // 5242880 bytes = 5 MB
    expect(sql).toMatch(/5242880/);
    expect(sql).toMatch(/image\/jpeg/);
    expect(sql).toMatch(/image\/png/);
    expect(sql).toMatch(/image\/webp/);
    // Disallow SVG to prevent active content / XSS injection vectors
    expect(sql).not.toMatch(/image\/svg\+xml/);
  });

  it('defines public SELECT policy on storage.objects for showroom visual assets', () => {
    expect(sql).toMatch(
      /create\s+policy\s+"Public can view showroom images"\s+on\s+storage\.objects/i
    );
    expect(sql).toMatch(/for\s+select/i);
    expect(sql).toMatch(/to\s+public/i);
    expect(sql).toMatch(
      /using\s*\(\s*bucket_id\s+in\s*\('motorcycles',\s*'promotions',\s*'hero-banners'\)\s*\)/i
    );
  });

  it('strictly restricts INSERT, UPDATE, and DELETE on storage.objects to authenticated admins', () => {
    // INSERT policy
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can upload showroom images"\s+on\s+storage\.objects/i
    );
    expect(sql).toMatch(/for\s+insert/i);
    expect(sql).toMatch(/to\s+authenticated/i);
    expect(sql).toMatch(/public\.is_admin\(\)/i);

    // UPDATE policy
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can update showroom images"\s+on\s+storage\.objects/i
    );
    expect(sql).toMatch(/for\s+update/i);
    expect(sql).toMatch(/to\s+authenticated/i);

    // DELETE policy
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can delete showroom images"\s+on\s+storage\.objects/i
    );
    expect(sql).toMatch(/for\s+delete/i);
    expect(sql).toMatch(/to\s+authenticated/i);
  });
});
