import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { escapePostgrestSearchTerm, sanitizePostgrestSearchTerm } from './search';

describe('escapePostgrestSearchTerm', () => {
  it('returns empty string for null, undefined, empty, or whitespace inputs', () => {
    expect(escapePostgrestSearchTerm(null)).toBe('');
    expect(escapePostgrestSearchTerm(undefined)).toBe('');
    expect(escapePostgrestSearchTerm('')).toBe('');
    expect(escapePostgrestSearchTerm('   ')).toBe('');
  });

  it('preserves clean alphanumeric keywords and natural spaces', () => {
    expect(escapePostgrestSearchTerm('Ahmad Dahlan')).toBe('Ahmad Dahlan');
    expect(escapePostgrestSearchTerm('Vario 160 CBS')).toBe('Vario 160 CBS');
    expect(escapePostgrestSearchTerm('Sidoarjo')).toBe('Sidoarjo');
    expect(escapePostgrestSearchTerm('081234567890')).toBe('081234567890');
    expect(escapePostgrestSearchTerm('INQ-20261103-A1B2')).toBe('INQ-20261103-A1B2');
  });

  it('preserves legitimate punctuation characters (commas, parentheses, colons, hyphens, periods, single quotes)', () => {
    expect(escapePostgrestSearchTerm('Budi, S.H.')).toBe('Budi, S.H.');
    expect(escapePostgrestSearchTerm('(031) 894-1234')).toBe('(031) 894-1234');
    expect(escapePostgrestSearchTerm('PT. Honda Motor (Persero)')).toBe(
      'PT. Honda Motor (Persero)'
    );
    expect(escapePostgrestSearchTerm('Blok A:12')).toBe('Blok A:12');
    expect(escapePostgrestSearchTerm("O'Connor")).toBe("O'Connor");
  });

  it('preserves punctuation-only queries as valid literal search terms', () => {
    expect(escapePostgrestSearchTerm(',')).toBe(',');
    expect(escapePostgrestSearchTerm(';')).toBe(';');
    expect(escapePostgrestSearchTerm(':')).toBe(':');
    expect(escapePostgrestSearchTerm('.')).toBe('.');
    expect(escapePostgrestSearchTerm('()')).toBe('()');
  });

  it('escapes double quotes to prevent terminating PostgREST string literal', () => {
    expect(escapePostgrestSearchTerm('"test"')).toBe('\\"test\\"');
    expect(escapePostgrestSearchTerm('Vario "Street" 160')).toBe('Vario \\"Street\\" 160');
  });

  it('escapes backslashes across JavaScript and PostgREST layers', () => {
    // A single backslash becomes 4 backslashes in JS replacement, delivering \\ to PostgREST -> \ to PostgreSQL
    expect(escapePostgrestSearchTerm('path\\test')).toBe('path\\\\\\\\test');
    expect(escapePostgrestSearchTerm('\\')).toBe('\\\\\\\\');
  });

  it('escapes SQL ILIKE wildcards (% and _) so they act as literal characters', () => {
    expect(escapePostgrestSearchTerm('100%')).toBe('100\\\\%');
    expect(escapePostgrestSearchTerm('%')).toBe('\\\\%');
    expect(escapePostgrestSearchTerm('lead_reference')).toBe('lead\\\\_reference');
    expect(escapePostgrestSearchTerm('_')).toBe('\\\\_');
  });

  it('handles complex combined inputs safely', () => {
    const input = 'Budi, S.H. (Diskon 10% "Resmi")\\Waru';
    const expected = 'Budi, S.H. (Diskon 10\\\\% \\"Resmi\\")\\\\\\\\Waru';
    expect(escapePostgrestSearchTerm(input)).toBe(expected);
  });

  it('provides sanitizePostgrestSearchTerm as a backward-compatible alias', () => {
    expect(sanitizePostgrestSearchTerm('Budi, S.H.')).toBe('Budi, S.H.');
    expect(sanitizePostgrestSearchTerm('100%')).toBe('100\\\\%');
  });
});

describe('PostgREST client URL serialization', () => {
  const dummyClient = createClient('http://127.0.0.1:54321', 'dummy-anon-key');

  function getSerializedOrParam(term: string): string | null {
    const escaped = escapePostgrestSearchTerm(term);
    const query = dummyClient
      .from('leads')
      .select('id')
      .or(`full_name.ilike."%${escaped}%",city.ilike."%${escaped}%"`);
    // Extract query url from Supabase client builder
    const url = new URL((query as unknown as { url: URL }).url.toString());
    return url.searchParams.get('or');
  }

  it('serializes terms into double-quoted PostgREST expressions without splitting by comma', () => {
    const serialized = getSerializedOrParam('Budi, S.H.');
    expect(serialized).toBe('(full_name.ilike."%Budi, S.H.%",city.ilike."%Budi, S.H.%")');
  });

  it('preserves parentheses inside quotes without breaking logical tree grouping', () => {
    const serialized = getSerializedOrParam('(031) 894');
    expect(serialized).toBe('(full_name.ilike."%(031) 894%",city.ilike."%(031) 894%")');
  });

  it('delivers escaped wildcards inside PostgREST quotes', () => {
    const serialized = getSerializedOrParam('100%');
    expect(serialized).toBe('(full_name.ilike."%100\\\\%%",city.ilike."%100\\\\%%")');
  });
});

describe('Live PostgREST query execution (when Supabase is accessible)', () => {
  function getEnvConfig(): { url: string; serviceKey: string } | null {
    let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        if (!key) {
          const matchKey = content.match(/SUPABASE_SERVICE_ROLE_KEY=([^\s\r\n]+)/);
          if (matchKey) key = matchKey[1];
        }
        if (!url) {
          const matchUrl = content.match(/NEXT_PUBLIC_SUPABASE_URL=([^\s\r\n]+)/);
          if (matchUrl) url = matchUrl[1];
        }
      }
    } catch {
      // ignore
    }
    if (!url || !key) return null;
    return { url, serviceKey: key };
  }

  const envConfig = getEnvConfig();
  const supabaseUrl = envConfig?.url || '';
  const serviceKey = envConfig?.serviceKey || null;
  const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

  it.skipIf(!serviceKey)(
    'executes search containing commas and parentheses without HTTP 400 Bad Request error',
    async () => {
      const client = createClient(supabaseUrl, serviceKey!, clientOptions);
      const term = escapePostgrestSearchTerm('Sidoarjo, (Waru)');
      const { error } = await client
        .from('leads')
        .select('id')
        .or(`full_name.ilike."%${term}%",city.ilike."%${term}%"`);

      expect(error).toBeNull();
    },
    10000
  );

  it.skipIf(!serviceKey)(
    'prevents wildcard % from matching all rows in the table',
    async () => {
      const client = createClient(supabaseUrl, serviceKey!, clientOptions);
      const term = escapePostgrestSearchTerm('%');
      const { data, error } = await client
        .from('leads')
        .select('id')
        .or(`full_name.ilike."%${term}%",city.ilike."%${term}%"`);

      expect(error).toBeNull();
      // In our test database, no lead literally contains '%' in name or city, so result count should be 0
      expect(data?.length).toBe(0);
    },
    10000
  );

  it.skipIf(!serviceKey)(
    'prevents PostgREST condition injection from matching all rows',
    async () => {
      const client = createClient(supabaseUrl, serviceKey!, clientOptions);
      const term = escapePostgrestSearchTerm('a,full_name.neq.null');
      const { data, error } = await client
        .from('leads')
        .select('id')
        .or(`full_name.ilike."%${term}%",city.ilike."%${term}%"`);

      expect(error).toBeNull();
      // The injection is treated as a literal search string, not a separate filter condition
      expect(data?.length).toBe(0);
    },
    10000
  );
});
