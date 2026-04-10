import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import type { Session } from 'next-auth'

export async function requireAuth(): Promise<Session & { user: { id: string; role: string } }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED')
  }
  return session as Session & { user: { id: string; role: string } }
}

export async function getOptionalSession() {
  return getServerSession(authOptions)
}
