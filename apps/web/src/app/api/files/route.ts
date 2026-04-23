export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { resolveIdentity } from '@/lib/apiAuth'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'
import { prisma } from '@opentomy/db'
import * as famaster from '@/lib/famaster'

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'

async function ensureSystemUser() {
  await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    create: { id: SYSTEM_USER_ID, email: 'system@opentomy.internal', name: 'System' },
    update: {},
  })
}

// GET /api/files — list public files (proxied to famaster)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 50)
  const search = searchParams.get('search') ?? ''

  try {
    const result = await famaster.getPublicFiles({ page, limit, search })
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof famaster.FamasterError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return toHttpResponse(error)
  }
}

// POST /api/files — upload a .optmy/.tomy file
export async function POST(req: NextRequest) {
  const identity = await resolveIdentity(req)
  if (!identity) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  try {
    const creatorId = identity.isApiKey ? SYSTEM_USER_ID : identity.userId
    if (identity.isApiKey) await ensureSystemUser()
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await container.uploadQuizFile.execute({
      buffer,
      fileSize: file.size,
      creatorId,
    })
    return NextResponse.json({ file_id: result.fileId, message: 'Upload successful' }, { status: 201 })
  } catch (error) {
    return toHttpResponse(error)
  }
}
