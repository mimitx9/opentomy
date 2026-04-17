import { NextResponse } from 'next/server'
import { prisma } from '@opentomy/db'

/**
 * Health check endpoint — used by Docker HEALTHCHECK and load balancers.
 * GET /api/health
 * Returns 200 { status: "ok" } when the app + DB are reachable.
 * Returns 503 when DB is unreachable.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { status: 'error', message: 'Database unreachable', detail: message },
      { status: 503 },
    )
  }
}
