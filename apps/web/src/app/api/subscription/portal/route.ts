import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { container } from '@/infrastructure/container'
import { toHttpResponse } from '@/lib/httpError'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const returnUrl = `${process.env.NEXTAUTH_URL}/subscription`

  try {
    const result = await container.createPortal.execute(session.user.id, returnUrl)

    const accept = req.headers.get('accept') ?? ''
    if (!accept.includes('application/json')) {
      return Response.redirect(result.portalUrl, 303)
    }

    return NextResponse.json({ portal_url: result.portalUrl })
  } catch (error) {
    return toHttpResponse(error)
  }
}
