import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toHttpResponse } from '@/lib/httpError'
import * as famaster from '@/lib/famaster'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const returnUrl = `${process.env.NEXTAUTH_URL}/subscription`

  try {
    const result = await famaster.createPortal(session.user.id, returnUrl)

    const accept = req.headers.get('accept') ?? ''
    if (!accept.includes('application/json')) {
      return Response.redirect((result as { portal_url: string }).portal_url, 303)
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof famaster.FamasterError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return toHttpResponse(error)
  }
}
