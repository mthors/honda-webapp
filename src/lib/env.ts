import { z } from 'zod';

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL.',
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required for client access.',
  }),
  NEXT_PUBLIC_DEALER_WHATSAPP: z.string().default('6281234567890'),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NOTIFICATION_EMAIL_TO: z.string().email().optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates public environment variables accessible in both server and client.
 */
export function validatePublicEnv(
  env: Record<string, string | undefined> = process.env
): PublicEnv {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_DEALER_WHATSAPP: env.NEXT_PUBLIC_DEALER_WHATSAPP,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => ` - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Public environment variable configuration error:\n${issues}`);
  }

  return result.data;
}

/**
 * Validates server-only environment variables.
 * Call this only in server contexts (Route Handlers, Server Actions, Server Components).
 */
export function validateServerEnv(
  env: Record<string, string | undefined> = process.env
): ServerEnv {
  const result = serverEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_DEALER_WHATSAPP: env.NEXT_PUBLIC_DEALER_WHATSAPP,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    NOTIFICATION_EMAIL_TO: env.NOTIFICATION_EMAIL_TO,
  });

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => ` - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Server environment variable configuration error:\n${issues}`);
  }

  return result.data;
}
