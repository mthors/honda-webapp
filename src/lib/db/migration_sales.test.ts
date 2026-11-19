import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Location-Based Sales Management and Service Areas Migration (20261119000001_create_sales_management_and_service_areas.sql)', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261119000001_create_sales_management_and_service_areas.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  it('creates public.provinces table with RLS and admin policies', () => {
    expect(sql).toMatch(/create\s+table\s+if\s+not\s+exists\s+public\.provinces\s*\(/i);
    expect(sql).toMatch(/id\s+text\s+primary\s+key/i);
    expect(sql).toMatch(/name\s+text\s+not\s+null\s+unique/i);
    expect(sql).toMatch(/alter\s+table\s+public\.provinces\s+enable\s+row\s+level\s+security;/i);
    expect(sql).toMatch(
      /create\s+policy\s+"Public can read active provinces"\s+on\s+public\.provinces/i
    );
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can manage provinces"\s+on\s+public\.provinces/i
    );
  });

  it('creates public.regencies table with foreign key to provinces and type constraint', () => {
    expect(sql).toMatch(/create\s+table\s+if\s+not\s+exists\s+public\.regencies\s*\(/i);
    expect(sql).toMatch(
      /province_id\s+text\s+not\s+null\s+references\s+public\.provinces\(id\)\s+on\s+delete\s+restrict/i
    );
    expect(sql).toMatch(
      /type\s+text\s+not\s+null\s+check\s*\(\s*type\s+in\s*\('kabupaten',\s*'kota'\)\s*\)/i
    );
    expect(sql).toMatch(
      /constraint\s+uq_regencies_province_name\s+unique\s*\(\s*province_id,\s*name\s*\)/i
    );
    expect(sql).toMatch(/alter\s+table\s+public\.regencies\s+enable\s+row\s+level\s+security;/i);
  });

  it('creates public.dealership_service_areas table referencing canonical dealerships', () => {
    expect(sql).toMatch(
      /create\s+table\s+if\s+not\s+exists\s+public\.dealership_service_areas\s*\(/i
    );
    expect(sql).toMatch(
      /dealership_id\s+uuid\s+not\s+null\s+references\s+public\.dealerships\(id\)\s+on\s+delete\s+cascade/i
    );
    expect(sql).toMatch(
      /regency_id\s+text\s+not\s+null\s+references\s+public\.regencies\(id\)\s+on\s+delete\s+restrict/i
    );
    expect(sql).toMatch(
      /constraint\s+uq_dealership_regency\s+unique\s*\(\s*dealership_id,\s*regency_id\s*\)/i
    );
    expect(sql).toMatch(
      /alter\s+table\s+public\.dealership_service_areas\s+enable\s+row\s+level\s+security;/i
    );
  });

  it('creates public.sales_representatives table with restrict on delete dealership foreign key', () => {
    expect(sql).toMatch(/create\s+table\s+if\s+not\s+exists\s+public\.sales_representatives\s*\(/i);
    expect(sql).toMatch(
      /dealership_id\s+uuid\s+not\s+null\s+references\s+public\.dealerships\(id\)\s+on\s+delete\s+restrict/i
    );
    expect(sql).toMatch(/name\s+text\s+not\s+null/i);
    expect(sql).toMatch(/whatsapp_number\s+text\s+not\s+null/i);
    expect(sql).toMatch(/photo_url\s+text\s+null/i);
    expect(sql).toMatch(/is_active\s+boolean\s+not\s+null\s+default\s+true/i);
    expect(sql).toMatch(
      /alter\s+table\s+public\.sales_representatives\s+enable\s+row\s+level\s+security;/i
    );
  });

  it('provisions sales-reps storage bucket with appropriate RLS policies', () => {
    expect(sql).toMatch(/'sales-reps'/i);
    expect(sql).toMatch(/bucket_id\s*=\s*'sales-reps'/i);
    expect(sql).toMatch(
      /create\s+policy\s+"Public can view sales rep photos"\s+on\s+storage\.objects/i
    );
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can upload sales rep photos"\s+on\s+storage\.objects/i
    );
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can update sales rep photos"\s+on\s+storage\.objects/i
    );
    expect(sql).toMatch(
      /create\s+policy\s+"Admins can delete sales rep photos"\s+on\s+storage\.objects/i
    );
  });

  it('seeds geographical reference data for operational regions in Jawa Timur', () => {
    expect(sql).toMatch(/'jawa-timur',\s*'Jawa Timur'/i);
    expect(sql).toMatch(/'kab-sidoarjo',\s*'jawa-timur',\s*'Kabupaten Sidoarjo',\s*'kabupaten'/i);
    expect(sql).toMatch(/'kota-surabaya',\s*'jawa-timur',\s*'Kota Surabaya',\s*'kota'/i);
    expect(sql).toMatch(/'kab-gresik'/i);
    expect(sql).toMatch(/'kab-malang'/i);
  });

  it('strictly adheres to constraint: does NOT seed fake sales representatives or fake service area assignments', () => {
    expect(sql).not.toMatch(/insert\s+into\s+public\.sales_representatives/i);
    expect(sql).not.toMatch(/insert\s+into\s+public\.dealership_service_areas/i);
  });
});
