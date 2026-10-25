import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from './client';

describe('Supabase browser client initialization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws an error if NEXT_PUBLIC_SUPABASE_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    expect(() => createClient()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('throws an error if NEXT_PUBLIC_SUPABASE_ANON_KEY is not set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => createClient()).toThrowError(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it('initializes client successfully when parameters or env vars are supplied', () => {
    const client = createClient('https://mock-proj.supabase.co', 'mock-anon-key');
    expect(client).toBeDefined();
    expect(typeof client.auth.signInWithPassword).toBe('function');
  });
});
