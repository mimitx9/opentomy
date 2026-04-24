import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
const API_SECRET = process.env.OPENTOMY_API_SECRET ?? ''

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.internalUserId || !session.canDecrypt) {
    return NextResponse.json({ error: 'access_denied' }, { status: 403 })
  }

  const res = await fetch(`${API_URL}/files/${params.id}/subjects`, {
    headers: {
      Authorization: `Bearer ${API_SECRET}`,
      'X-User-ID': session.internalUserId,
    },
  })

  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
