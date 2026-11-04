import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServiceClient } from './server';

describe('Supabase server-side service client initialization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws fast if NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-service-role-key';

    expect(() => createServiceClient()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL must be configured/);
  });

  it('throws fast if SUPABASE_SERVICE_ROLE_KEY is missing, refusing silent fallback to anon key', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-public-key-should-not-be-used';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Must fail fast with descriptive error, not fallback to anon key
    expect(() => createServiceClient()).toThrowError(
      /SUPABASE_SERVICE_ROLE_KEY must be configured in server environment/
    );
  });

  it('initializes successfully when SUPABASE_SERVICE_ROLE_KEY is configured in env', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://demo.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-secret';

    const client = createServiceClient();
    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
    expect(typeof client.from).toBe('function');
  });

  it('initializes successfully when custom service key and url are passed directly', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const client = createServiceClient('https://custom-proj.supabase.co', 'custom-service-key');
    expect(client).toBeDefined();
    expect(client.from).toBeDefined();
    expect(typeof client.from).toBe('function');
  });
});
