import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@opentomy/db'
import { getOptmyFileBuffer } from '@/lib/s3'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const file = await prisma.quizFile.findUnique({ where: { id: params.id } })
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only return file if user has a pending/valid decrypt token for this file
  const token = await prisma.decryptToken.findFirst({
    where: {
      userId: session.user.id,
      fileId: params.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
  if (!token) {
    return NextResponse.json({ error: 'No valid decrypt token' }, { status: 403 })
  }

  const buffer = await getOptmyFileBuffer(file.fileKey)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.id}.optmy"`,
    },
  })
}
