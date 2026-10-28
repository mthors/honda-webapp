import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/database';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedAdmin } from '@/lib/auth/admin';
import { uuidSchema } from '@/types/pricing';

export const auditActionPayloadSchema = z.object({
  action: z
    .string()
    .trim()
    .min(2, 'Aksi audit minimal 2 karakter')
    .max(100, 'Aksi audit maksimal 100 karakter'),
  entityType: z
    .string()
    .trim()
    .min(2, 'Tipe entitas minimal 2 karakter')
    .max(100, 'Tipe entitas maksimal 100 karakter'),
  entityId: uuidSchema.nullable().optional(),
  summary: z
    .string()
    .trim()
    .min(5, 'Ringkasan audit minimal 5 karakter')
    .max(500, 'Ringkasan audit maksimal 500 karakter'),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type AuditActionPayload = z.infer<typeof auditActionPayloadSchema>;

export interface AuditLogResult {
  success: boolean;
  logId: string;
}

/**
 * Server-only helper to record an administrative mutation into the immutable audit_logs table.
 *
 * Security requirements:
 * 1. Actor identity is resolved strictly from the verified administrator session (never client-supplied).
 * 2. Operates via authenticated Supabase client adhering to RLS policies (no service-role bypass).
 * 3. Failures are propagated explicitly; caller operations must abort if logging fails.
 */
export async function logAdminAction(
  payload: AuditActionPayload,
  client?: SupabaseClient<Database>
): Promise<AuditLogResult> {
  // Validate audit payload format
  const parsed = auditActionPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => i.message).join('; ');
    throw new Error(`Validasi payload audit gagal: ${errorDetails}`);
  }

  // Verify authenticated administrator session
  const supabase = client ?? (await createClient());
  const adminSession = await getAuthenticatedAdmin(supabase);

  if (!adminSession) {
    throw new Error(
      'Gagal mencatat audit log: Pengguna saat ini tidak terautentikasi sebagai administrator aktif.'
    );
  }

  const actorId = adminSession.user.id;

  // Insert into audit_logs table respecting RLS
  const insertPayload: Database['public']['Tables']['audit_logs']['Insert'] = {
    actor_id: actorId,
    action: parsed.data.action,
    entity_type: parsed.data.entityType,
    entity_id: parsed.data.entityId || null,
    summary: parsed.data.summary,
    metadata: (parsed.data.metadata || {}) as Record<string, Json>,
  };

  const { data, error } = await supabase
    .from('audit_logs')
    .insert(insertPayload as never)
    .select('id')
    .single();

  const insertedRow = data as { id: string } | null;

  if (error || !insertedRow) {
    const msg = error?.message || 'Data log tidak dikembalikan oleh basis data';
    throw new Error(`Gagal menyimpan audit log ke basis data: ${msg}`);
  }

  return {
    success: true,
    logId: insertedRow.id,
  };
}
