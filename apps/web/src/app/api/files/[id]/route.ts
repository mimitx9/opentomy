import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@opentomy/db'
import { deleteOptmyFile } from '@/lib/s3'

// GET /api/files/:id — file metadata + access status
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const file = await prisma.quizFile.findUnique({ where: { id: params.id } })
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let hasAccess = false
  let accessType: string | undefined

  if (session?.user?.id) {
    const now = new Date()
    const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } })
    const isActive = sub?.status === 'ACTIVE'
    const isTrialing = sub?.status === 'TRIALING' && sub.trialEndsAt != null && sub.trialEndsAt > now

    if (isActive || isTrialing) {
      hasAccess = true
      accessType = 'SUBSCRIPTION'
    } else {
      const fa = await prisma.fileAccess.findUnique({
        where: { userId_fileId: { userId: session.user.id, fileId: params.id } },
      })
      if (fa && (fa.expiresAt == null || fa.expiresAt > now)) {
        hasAccess = true
        accessType = fa.accessType
      }
    }
  }

  return NextResponse.json({ ...file, access: { hasAccess, accessType } })
}

// DELETE /api/files/:id — creator or admin only
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const file = await prisma.quizFile.findUnique({ where: { id: params.id } })
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = file.creatorId === session.user.id
  const isAdmin = (session.user as { role?: string }).role === 'ADMIN'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await deleteOptmyFile(file.fileKey)
  await prisma.quizFile.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
