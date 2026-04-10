/**
 * Server-side decrypt token generation and verification.
 * These run in Node.js ONLY (Next.js API routes, Electron main process).
 * Never expose SERVER_DECRYPT_SECRET to the browser/renderer.
 */

/**
 * Generate a single-use decrypt token.
 * Format: HMAC-SHA256(serverSecret, "<file_id>:<user_id>:<expiry_ts>") encoded as hex.
 */
export async function generateDecryptToken(
  serverSecret: string,
  fileId: string,
  userId: string,
  ttlMs = 15 * 60 * 1000, // 15 minutes
): Promise<{ token: string; expiresAt: Date }> {
  const { createHmac } = await import('crypto')
  const expiresAt = new Date(Date.now() + ttlMs)
  const expiryTs = expiresAt.getTime().toString()
  const payload = `${fileId}:${userId}:${expiryTs}`
  const token = createHmac('sha256', serverSecret).update(payload).digest('hex')
  // Embed expiry so we can verify without DB lookup (DB check still required for single-use)
  const fullToken = `${token}.${expiryTs}`
  return { token: fullToken, expiresAt }
}

/**
 * Verify a decrypt token signature and expiry.
 * Does NOT check single-use (that requires a DB lookup).
 */
export async function verifyDecryptToken(
  serverSecret: string,
  fullToken: string,
  fileId: string,
  userId: string,
): Promise<boolean> {
  const { createHmac, timingSafeEqual } = await import('crypto')
  try {
    const [hmacPart, expiryTs] = fullToken.split('.')
    if (!hmacPart || !expiryTs) return false

    const expiry = parseInt(expiryTs, 10)
    if (Date.now() > expiry) return false

    const payload = `${fileId}:${userId}:${expiryTs}`
    const expected = createHmac('sha256', serverSecret).update(payload).digest('hex')
    return timingSafeEqual(Buffer.from(hmacPart, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}
