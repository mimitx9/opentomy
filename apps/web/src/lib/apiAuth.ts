/**
 * apiAuth — dual authentication helper
 *
 * Supports two modes:
 *   1. Browser session  : NextAuth session cookie (human users)
 *   2. API key          : Authorization: Bearer <API_SECRET_KEY>  (server-to-server)
 *
 * Returns { userId, isApiKey } or null if unauthenticated.
 *
 * API_SECRET_KEY env var: a secret string you choose, set in Vercel env.
 * When using API key, userId is set to "api-key-user" (a virtual user).
 * To map to a real user set API_KEY_USER_ID in env.
 */
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { timingSafeEqual } from 'crypto'

export interface ApiIdentity {
  userId: string
  isApiKey: boolean
}

function safeCompare(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a)
    const bb = Buffer.from(b)
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

export async function resolveIdentity(req: NextRequest): Promise<ApiIdentity | null> {
  // 1. Try API key first (Authorization: Bearer <key>)
  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    const secret = process.env.API_SECRET_KEY ?? ''
    if (secret && safeCompare(token, secret)) {
      const userId = process.env.API_KEY_USER_ID ?? 'api-key-user'
      return { userId, isApiKey: true }
    }
    // Bearer header present but wrong → reject immediately (don't fall through to session)
    return null
  }

  // 2. Try NextAuth session
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return { userId: session.user.id, isApiKey: false }
  }

  return null
}
