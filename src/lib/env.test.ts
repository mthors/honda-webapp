import { describe, it, expect } from 'vitest';
import { validatePublicEnv, validateServerEnv } from './env';

describe('Environment validation', () => {
  it('successfully validates valid public environment variables', () => {
    const validEnv = {
      NEXT_PUBLIC_APP_URL: 'https://honda-satrya.example.com',
      NEXT_PUBLIC_SUPABASE_URL: 'https://xyzcompany.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-123',
      NEXT_PUBLIC_DEALER_WHATSAPP: '6281234567890',
    };

    const parsed = validatePublicEnv(validEnv);
    expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBe('https://xyzcompany.supabase.co');
    expect(parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key-123');
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe('https://honda-satrya.example.com');
  });

  it('throws an informative error when NEXT_PUBLIC_SUPABASE_URL is missing or invalid', () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'not-a-valid-url',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'valid-key',
    };

    expect(() => validatePublicEnv(invalidEnv)).toThrowError(
      /Public environment variable configuration error/
    );
  });

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is empty', () => {
    const invalidEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://xyzcompany.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
    };

    expect(() => validatePublicEnv(invalidEnv)).toThrowError(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY is required/
    );
  });

  it('validates server env with optional service role key and notification email', () => {
    const validServerEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://xyzcompany.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret-key',
      NOTIFICATION_EMAIL_TO: 'sales@satryagroup.co.id',
    };

    const parsed = validateServerEnv(validServerEnv);
    expect(parsed.SUPABASE_SERVICE_ROLE_KEY).toBe('service-role-secret-key');
    expect(parsed.NOTIFICATION_EMAIL_TO).toBe('sales@satryagroup.co.id');
  });

  it('fails server env validation if notification email is malformed', () => {
    const invalidServerEnv = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://xyzcompany.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      NOTIFICATION_EMAIL_TO: 'invalid-email-address',
    };

    expect(() => validateServerEnv(invalidServerEnv)).toThrowError(/NOTIFICATION_EMAIL_TO/);
  });
});
