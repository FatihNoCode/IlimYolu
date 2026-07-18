import { getSupabaseClient } from './supabase';

const supabase = getSupabaseClient();

// Shared TOTP enroll/verify flow used both by UserMenu's post-login "Security"
// panel and by InvitePage's forced setup during account creation. Enrollment
// itself happens directly against Supabase's GoTrue API (supabase.auth.mfa.*)
// — /mfa/sync only keeps this server's cached `mfaEnrolled` flag in step with
// what Supabase actually has, since that's what route middleware relies on.

export async function startTotpEnroll(): Promise<{ factorId: string; qrCode: string; secret: string }> {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
  if (error) throw error;
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

export async function confirmTotpEnroll(
  factorId: string,
  code: string,
  apiRequest: (endpoint: string, options?: RequestInit) => Promise<any>,
): Promise<void> {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;
  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: code.trim(),
  });
  if (verifyError) throw verifyError;

  await apiRequest('/mfa/sync', { method: 'POST' });
}
