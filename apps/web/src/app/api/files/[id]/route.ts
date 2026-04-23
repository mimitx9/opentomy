import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toHttpResponse } from '@/lib/httpError'
import * as famaster from '@/lib/famaster'

// GET /api/files/:id — proxied to famaster
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  try {
    const result = await famaster.getFile(params.id, session?.user?.id)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof famaster.FamasterError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return toHttpResponse(error)
  }
}

// DELETE /api/files/:id — proxied to famaster
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await famaster.deleteFile(
      params.id,
      session.user.id,
      (session.user as { role?: string }).role ?? 'USER',
    )
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof famaster.FamasterError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return toHttpResponse(error)
  }
}
