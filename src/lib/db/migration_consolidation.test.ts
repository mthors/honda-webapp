import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Event Dealership Consolidation Migration (20261117000002_consolidate_events_with_dealerships.sql)', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261117000002_consolidate_events_with_dealerships.sql'
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  it('safely deletes test event by exact UUID and title', () => {
    expect(sql).toMatch(
      /delete\s+from\s+public\.events\s+where\s+id\s*=\s*'4fc4b913-fa54-4d6a-bf90-bc8cb51539c6'\s+and\s+title\s*=\s*'Test acara'/i
    );
  });

  it('adds dealership_id foreign key referencing public.dealerships with ON DELETE RESTRICT', () => {
    expect(sql).toMatch(/alter\s+table\s+public\.events/i);
    expect(sql).toMatch(
      /dealership_id\s+uuid\s+references\s+public\.dealerships\(id\)\s+on\s+delete\s+restrict/i
    );
  });

  it('validates no unmapped events remain before setting NOT NULL', () => {
    expect(sql).toMatch(/select\s+count\(\*\)\s+into\s+unmapped_count/i);
    expect(sql).toMatch(/from\s+public\.events\s+where\s+dealership_id\s+is\s+null/i);
    expect(sql).toMatch(/raise\s+exception/i);
  });

  it('enforces NOT NULL constraint and creates index on dealership_id', () => {
    expect(sql).toMatch(/alter\s+column\s+dealership_id\s+set\s+not\s+null/i);
    expect(sql).toMatch(
      /create\s+index\s+if\s+not\s+exists\s+idx_events_dealership\s+on\s+public\.events\(dealership_id\)/i
    );
  });

  it('explicitly removes known dependencies before dropping table (avoiding CASCADE)', () => {
    expect(sql).toMatch(/drop\s+constraint\s+if\s+exists\s+events_location_id_fkey/i);
    expect(sql).toMatch(/drop\s+index\s+if\s+exists\s+public\.idx_events_location/i);
    expect(sql).toMatch(/drop\s+column\s+if\s+exists\s+location_id/i);
    expect(sql).toMatch(/drop\s+policy\s+if\s+exists/i);
    expect(sql).toMatch(/drop\s+trigger\s+if\s+exists/i);
    expect(sql).toMatch(/drop\s+table\s+if\s+exists\s+public\.dealer_locations;/i);
    expect(sql).not.toMatch(/drop\s+table\s+if\s+exists\s+public\.dealer_locations\s+cascade/i);
  });

  it('guarantees dependent policies, constraints, and tables are dropped BEFORE dropping events.location_id', () => {
    const dropCrossTablePolicyIndex = sql.indexOf(
      'drop policy if exists "Public can view active dealer locations for published events" on public.dealer_locations;'
    );
    const dropFkIndex = sql.indexOf('drop constraint if exists events_location_id_fkey;');
    const dropTableIndex = sql.indexOf('drop table if exists public.dealer_locations;');
    const dropColumnIndex = sql.indexOf('drop column if exists location_id;');

    expect(dropCrossTablePolicyIndex).toBeGreaterThan(0);
    expect(dropFkIndex).toBeGreaterThan(dropCrossTablePolicyIndex);
    expect(dropTableIndex).toBeGreaterThan(dropFkIndex);
    expect(dropColumnIndex).toBeGreaterThan(dropTableIndex);
  });
});
