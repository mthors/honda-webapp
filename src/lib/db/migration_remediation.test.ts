import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Remediate Admin Concurrency and Privileges Migration Security Validation', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261031000002_remediate_admin_concurrency_and_privileges.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  describe('1. Price Update Concurrency & Deadlock Prevention', () => {
    it('locks existing price entry row FOR UPDATE before resolving variants', () => {
      expect(sql).toMatch(
        /select\s+\*\s+into\s+v_old_price\s+from\s+public\.price_entries\s+where\s+id\s*=\s*p_id\s+for\s+update/i
      );
    });

    it('determines effective variant from input or fallback to existing record', () => {
      expect(sql).toMatch(
        /v_effective_variant_id\s*:=\s*coalesce\(p_variant_id,\s*v_old_variant_id\)/i
      );
    });

    it('locks both variants in deterministic ascending UUID order when variant changes', () => {
      expect(sql).toMatch(
        /from\s+public\.motorcycle_variants\s+where\s+id\s+in\s*\(\s*v_old_variant_id\s*,\s*v_effective_variant_id\s*\)\s+order\s+by\s+id\s+asc\s+for\s+update/i
      );
    });

    it('locks single variant when unchanged or on insert', () => {
      expect(sql).toMatch(
        /from\s+public\.motorcycle_variants\s+where\s+id\s*=\s*v_effective_variant_id\s+for\s+update/i
      );
    });

    it('performs conflict detection using effective variant under acquired locks', () => {
      expect(sql).toMatch(/where\s+variant_id\s*=\s*v_effective_variant_id/i);
    });
  });

  describe('2. Comprehensive Audit Metadata (Previous & New State)', () => {
    it('captures previous_state and new_state in admin_upsert_price_entry', () => {
      expect(sql).toMatch(
        /'previous_state',\s*case\s+when\s+v_old_price\.id\s+is\s+not\s+null\s+then\s+jsonb_build_object\(/i
      );
      expect(sql).toMatch(/'new_state',\s*jsonb_build_object\(/i);
    });

    it('captures previous_state and new_state including model_ids in admin_upsert_promotion', () => {
      expect(sql).toMatch(
        /'previous_state',\s*case\s+when\s+v_old_promo\.id\s+is\s+not\s+null\s+then\s+jsonb_build_object\([\s\S]*?'model_ids',\s*v_old_model_ids/i
      );
      expect(sql).toMatch(
        /'new_state',\s*jsonb_build_object\([\s\S]*?'model_ids',\s*v_new_model_ids/i
      );
    });

    it('captures previous_state and new_state in admin_upsert_hero_banner', () => {
      expect(sql).toMatch(
        /'previous_state',\s*case\s+when\s+v_old_banner\.id\s+is\s+not\s+null\s+then\s+jsonb_build_object\(/i
      );
      expect(sql).toMatch(/'new_state',\s*jsonb_build_object\(/i);
    });
  });

  describe('3. Direct DML Bypass Prevention (Revoked Grants)', () => {
    const targetTables = ['price_entries', 'promotions', 'promotion_models', 'hero_banners'];

    targetTables.forEach((table) => {
      it(`revokes INSERT, UPDATE, DELETE on public.${table} from public, anon, and authenticated`, () => {
        const revokeRegex = new RegExp(
          `revoke\\s+insert,\\s*update,\\s*delete\\s+on\\s+table\\s+public\\.${table}\\s+from\\s+public,\\s*anon,\\s*authenticated`,
          'i'
        );
        expect(sql).toMatch(revokeRegex);
      });

      it(`grants SELECT on public.${table} to anon, authenticated, and service_role`, () => {
        const grantRegex = new RegExp(
          `grant\\s+select\\s+on\\s+table\\s+public\\.${table}\\s+to\\s+anon,\\s*authenticated,\\s*service_role`,
          'i'
        );
        expect(sql).toMatch(grantRegex);
      });
    });
  });
});
