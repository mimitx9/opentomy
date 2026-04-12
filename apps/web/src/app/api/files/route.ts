import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'

// GET /api/files — list public files
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const search = searchParams.get('search') ?? ''

  try {
    const result = await container.getPublicFiles.execute({ page, limit, search })
    return NextResponse.json({
      data: result.files,
      total: result.total,
      page,
      limit,
      has_more: result.hasMore,
    })
  } catch (error) {
    return toHttpResponse(error)
  }
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

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await container.uploadQuizFile.execute({
      buffer,
      fileSize: file.size,
      creatorId: session.user.id,
    })
    return NextResponse.json({ file_id: result.fileId, message: 'Upload successful' }, { status: 201 })
  } catch (error) {
    return toHttpResponse(error)
  }
}
