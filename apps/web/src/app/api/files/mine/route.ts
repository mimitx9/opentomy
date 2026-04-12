import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'

// GET /api/files/mine — files uploaded by the current user
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const files = await container.getMyFiles.execute(session.user.id)
    return NextResponse.json({ data: files, total: files.length })
  } catch (error) {
    return toHttpResponse(error)
  }
}
