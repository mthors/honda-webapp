import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Atomic Admin Mutations Migration Security Validation', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261031000001_atomic_admin_mutations.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  it('contains definitions for all 3 atomic admin upsert functions', () => {
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.admin_upsert_price_entry\s*\(/i
    );
    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.admin_upsert_promotion\s*\(/i);
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.admin_upsert_hero_banner\s*\(/i
    );
  });

  it('hardens all admin functions with SECURITY DEFINER and safe search_path', () => {
    const definerCount = (sql.match(/security\s+definer/gi) || []).length;
    expect(definerCount).toBeGreaterThanOrEqual(3);

    const searchPathCount = (sql.match(/set\s+search_path\s*=\s*public/gi) || []).length;
    expect(searchPathCount).toBeGreaterThanOrEqual(3);
  });

  it('strictly verifies active admin status via public.is_admin() in every function', () => {
    const adminCheckCount = (sql.match(/if\s+not\s+public\.is_admin\(\)\s+then/gi) || []).length;
    expect(adminCheckCount).toBe(3);
  });

  it('enforces concurrency serialization via row-level lock FOR UPDATE on motorcycle_variants', () => {
    expect(sql).toMatch(
      /from\s+public\.motorcycle_variants\s+where\s+id\s*=\s*p_variant_id\s+for\s+update/i
    );
  });

  it('normalizes city for price conflict detection', () => {
    expect(sql).toMatch(
      /lower\(trim\(regexp_replace\(coalesce\(p_city,\s*''\),\s*'\\s\+',\s*' ',\s*'g'\)\)\)/i
    );
  });

  it('integrates atomic audit log insertion within each mutation function', () => {
    const auditInsertCount = (sql.match(/insert\s+into\s+public\.audit_logs/gi) || []).length;
    expect(auditInsertCount).toBe(3);
  });

  it('revokes execute privileges from public and anon, granting only to authenticated', () => {
    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.admin_upsert_price_entry[^;]+from\s+public,\s*anon;/i
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.admin_upsert_price_entry[^;]+to\s+authenticated;/i
    );

    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.admin_upsert_promotion[^;]+from\s+public,\s*anon;/i
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.admin_upsert_promotion[^;]+to\s+authenticated;/i
    );

    expect(sql).toMatch(
      /revoke\s+all\s+on\s+function\s+public\.admin_upsert_hero_banner[^;]+from\s+public,\s*anon;/i
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.admin_upsert_hero_banner[^;]+to\s+authenticated;/i
    );
  });
});
