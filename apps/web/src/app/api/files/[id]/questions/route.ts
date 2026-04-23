import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toHttpResponse } from '@/lib/httpError'
import * as famaster from '@/lib/famaster'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  try {
    const body = await req.json()
    const result = await famaster.getQuestions(params.id, session?.user?.id, body)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof famaster.FamasterError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return toHttpResponse(error)
  }
}
