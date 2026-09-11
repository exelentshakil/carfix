import crypto from 'crypto';

export const ADMIN_COOKIE_NAME = 'carfix_admin_session';

function getAdminSecret(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

/**
 * Creates a signed, tamper-proof session token valid for 7 days.
 * Throws if ADMIN_PASSWORD is not configured on the server.
 */
export function createAdminSessionToken(): string {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error('ADMIN_PASSWORD is not configured on server');
  }

  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`carfix_admin:${timestamp}`)
    .digest('hex');

  return `${timestamp}.${signature}`;
}

/**
 * Validates the HMAC signature, hex encoding, and expiration timestamp of the session token.
 * Returns false if token is expired, tampered with, or if ADMIN_PASSWORD is not set.
 */
export function verifyAdminSessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;

  const secret = getAdminSecret();
  if (!secret) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  if (!signature || signature.length !== 64 || !/^[0-9a-f]{64}$/i.test(signature)) {
    return false;
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // 7 days expiration window
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`carfix_admin:${timestamp}`)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== 32 || expBuf.length !== 32) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
