import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'

// GET /api/files/:id — file metadata + access status
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  try {
    const result = await container.getFileWithAccess.execute(params.id, session?.user?.id)
    return NextResponse.json({ ...result.file, access: result.access })
  } catch (error) {
    return toHttpResponse(error)
  }
}

// DELETE /api/files/:id — creator or admin only
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await container.deleteFile.execute({
      fileId: params.id,
      userId: session.user.id,
      userRole: (session.user as { role?: string }).role ?? 'USER',
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return toHttpResponse(error)
  }
}
