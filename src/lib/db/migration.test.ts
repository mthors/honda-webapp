import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Migration & RLS Security Validation', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261025000001_initial_schema.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  const expectedTables = [
    'staff_profiles',
    'categories',
    'motorcycle_models',
    'motorcycle_variants',
    'colors',
    'variant_colors',
    'model_images',
    'price_entries',
    'promotions',
    'promotion_models',
    'hero_banners',
    'leads',
    'site_settings',
    'audit_logs',
  ];

  it('contains definitions for all 14 required V1 database tables', () => {
    for (const table of expectedTables) {
      const regex = new RegExp(
        `create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${table}\\s*\\(`,
        'i'
      );
      expect(sql).toMatch(regex);
    }
  });

  it('enables Row Level Security (RLS) on every single table', () => {
    for (const table of expectedTables) {
      const regex = new RegExp(
        `alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security;`,
        'i'
      );
      expect(sql).toMatch(regex);
    }
  });

  it('hardens public.is_admin() with security definer, explicit search_path, and revoked public execute', () => {
    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.is_admin\(\)/i);
    expect(sql).toMatch(/security\s+definer/i);
    expect(sql).toMatch(/set\s+search_path\s*=\s*public/i);
    expect(sql).toMatch(/revoke\s+all\s+on\s+function\s+public\.is_admin\(\)\s+from\s+public;/i);
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.is_admin\(\)\s+to\s+authenticated;/i
    );
  });

  it('strictly protects leads table: no public/anon select or insert policies', () => {
    // Check for any public or anon policy on leads
    const anonLeadPolicy =
      /create\s+policy\s+["'][^"']+["']\s+on\s+public\.leads[^;]+to\s+(?:public|anon)/i;
    expect(sql).not.toMatch(anonLeadPolicy);

    // Verify admin policies exist for leads
    expect(sql).toMatch(/create\s+policy\s+"Admins can read leads"\s+on\s+public\.leads/i);
    expect(sql).toMatch(/create\s+policy\s+"Admins can insert leads"\s+on\s+public\.leads/i);
    expect(sql).toMatch(/create\s+policy\s+"Admins can update leads"\s+on\s+public\.leads/i);
    expect(sql).toMatch(/create\s+policy\s+"Admins can delete leads"\s+on\s+public\.leads/i);
  });

  it('strictly protects staff_profiles and audit_logs: no public/anon access', () => {
    const anonStaffPolicy =
      /create\s+policy\s+["'][^"']+["']\s+on\s+public\.staff_profiles[^;]+to\s+(?:public|anon)/i;
    const anonAuditPolicy =
      /create\s+policy\s+["'][^"']+["']\s+on\s+public\.audit_logs[^;]+to\s+(?:public|anon)/i;
    expect(sql).not.toMatch(anonStaffPolicy);
    expect(sql).not.toMatch(anonAuditPolicy);
  });

  it('protects audit_logs from modification or deletion (immutable audit log)', () => {
    // Verify no update or delete RLS policies exist
    const auditUpdate =
      /create\s+policy\s+["'][^"']+["']\s+on\s+public\.audit_logs\s+for\s+update/i;
    const auditDelete =
      /create\s+policy\s+["'][^"']+["']\s+on\s+public\.audit_logs\s+for\s+delete/i;
    expect(sql).not.toMatch(auditUpdate);
    expect(sql).not.toMatch(auditDelete);

    // Verify defensive triggers blocking update, delete, and truncate on audit_logs
    expect(sql).toMatch(
      /create\s+or\s+replace\s+function\s+public\.prevent_audit_log_modification\(\)/i
    );
    expect(sql).toMatch(
      /create\s+trigger\s+trg_audit_logs_prevent_modification\s+before\s+update\s+or\s+delete\s+on\s+public\.audit_logs/i
    );
    expect(sql).toMatch(
      /create\s+trigger\s+trg_audit_logs_prevent_truncate\s+before\s+truncate\s+on\s+public\.audit_logs/i
    );

    // Verify explicit privilege revocations from application and service roles
    expect(sql).toMatch(
      /revoke\s+update,\s*delete\s+on\s+public\.audit_logs\s+from\s+public,\s*anon,\s*authenticated;/i
    );
    expect(sql).toMatch(
      /revoke\s+truncate\s+on\s+public\.audit_logs\s+from\s+public,\s*anon,\s*authenticated,\s*service_role;/i
    );
  });

  it('enforces status checks and publication schedule for public catalog visibility', () => {
    // Model publication schedule check
    expect(sql).toMatch(
      /status\s*=\s*'published'\s+and\s+\(published_at\s+is\s+null\s+or\s+published_at\s*<=\s*now\(\)\)/i
    );

    // Dependent policies propagation check (prices, variant colors, variants, images)
    expect(sql).toMatch(
      /m\.status\s*=\s*'published'\s+and\s+\(m\.published_at\s+is\s+null\s+or\s+m\.published_at\s*<=\s*now\(\)\)/i
    );

    expect(sql).toMatch(/is_published\s*=\s*true\s+and\s+valid_from\s*<=\s*current_date/i);
    expect(sql).toMatch(
      /status\s*=\s*'published'\s+and\s+starts_at\s*<=\s*now\(\)\s+and\s+ends_at\s*>=\s*now\(\)/i
    );
  });

  it('includes foreign key relationships and cascade/restrict constraints', () => {
    // motorcycle_variants references motorcycle_models on delete cascade
    expect(sql).toMatch(
      /model_id\s+uuid\s+not\s+null\s+references\s+public\.motorcycle_models\(id\)\s+on\s+delete\s+cascade/i
    );
    // motorcycle_models references categories on delete restrict
    expect(sql).toMatch(
      /category_id\s+uuid\s+not\s+null\s+references\s+public\.categories\(id\)\s+on\s+delete\s+restrict/i
    );
    // price_entries references motorcycle_variants on delete cascade
    expect(sql).toMatch(
      /variant_id\s+uuid\s+not\s+null\s+references\s+public\.motorcycle_variants\(id\)\s+on\s+delete\s+cascade/i
    );
  });
});

describe('Security Hardening Migration (20261025000002_harden_table_privileges.sql)', () => {
  const hardeningPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261025000002_harden_table_privileges.sql'
  );
  const hardeningSql = fs.readFileSync(hardeningPath, 'utf-8');
  // Strip comments to test executable SQL statements directly
  const executableSql = hardeningSql.replace(/--.*$/gm, '');

  it('revokes all table privileges from public, anon, authenticated, and service_role on sensitive tables', () => {
    expect(executableSql).toMatch(
      /revoke\s+all\s+on\s+table\s+public\.staff_profiles\s+from\s+public,\s*anon,\s*authenticated,\s*service_role;/i
    );
    expect(executableSql).toMatch(
      /revoke\s+all\s+on\s+table\s+public\.leads\s+from\s+public,\s*anon,\s*authenticated,\s*service_role;/i
    );
    expect(executableSql).toMatch(
      /revoke\s+all\s+on\s+table\s+public\.audit_logs\s+from\s+public,\s*anon,\s*authenticated,\s*service_role;/i
    );
  });

  it('grants required CRUD privileges to authenticated and service_role on staff_profiles and leads without truncate', () => {
    expect(executableSql).toMatch(
      /grant\s+select,\s*insert,\s*update,\s*delete\s+on\s+table\s+public\.staff_profiles\s+to\s+authenticated,\s*service_role;/i
    );
    expect(executableSql).toMatch(
      /grant\s+select,\s*insert,\s*update,\s*delete\s+on\s+table\s+public\.leads\s+to\s+authenticated,\s*service_role;/i
    );
    // Explicitly verify truncate is not granted to any role
    expect(executableSql).not.toMatch(
      /grant\s+[^;]*truncate[^;]*on\s+table\s+public\.(?:staff_profiles|leads)/i
    );
  });

  it('strictly limits audit_logs privileges to select and insert for authenticated and service_role', () => {
    expect(executableSql).toMatch(
      /revoke\s+all\s+on\s+table\s+public\.audit_logs\s+from\s+public,\s*anon,\s*authenticated,\s*service_role;/i
    );
    expect(executableSql).toMatch(
      /grant\s+select,\s*insert\s+on\s+table\s+public\.audit_logs\s+to\s+authenticated,\s*service_role;/i
    );
    // Ensure no broad or modifying grant is given to audit_logs
    expect(executableSql).not.toMatch(/grant\s+all\s+on\s+table\s+public\.audit_logs/i);
    expect(executableSql).not.toMatch(
      /grant\s+[^;]*(?:update|delete|truncate)[^;]*on\s+table\s+public\.audit_logs/i
    );
  });
});
