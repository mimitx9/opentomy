import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@opentomy/db'
import { uploadOptmyFile } from '@/lib/s3'
import { parseOptmyBuffer } from '@opentomy/crypto'
import { randomUUID } from 'crypto'

// GET /api/files — list public files
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const search = searchParams.get('search') ?? ''

  const where = {
    isPublic: true,
    ...(search ? { title: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  const [files, total] = await Promise.all([
    prisma.quizFile.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.quizFile.count({ where }),
  ])

  return NextResponse.json({ data: files, total, page, limit, has_more: total > page * limit })
}

// POST /api/files — upload a .optmy file
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Validate .optmy magic bytes
  let header
  try {
    const parsed = parseOptmyBuffer(buffer.buffer)
    header = parsed.header
  } catch {
    return NextResponse.json({ error: 'Invalid .optmy file' }, { status: 422 })
  }

  const fileId = randomUUID()
  const fileKey = `quizzes/${fileId}.optmy`

  await uploadOptmyFile(fileKey, buffer)

  const record = await prisma.quizFile.create({
    data: {
      id: fileId,
      creatorId: session.user.id,
      title: header.title,
      description: header.description,
      questionCount: header.question_count,
      tags: header.tags,
      thumbnailUrl: header.thumbnail_url,
      fileKey,
      fileSize: file.size,
      contentVersion: header.content_version,
      isPublic: true,
    },
  })

  return NextResponse.json({ file_id: record.id, message: 'Upload successful' }, { status: 201 })
}
