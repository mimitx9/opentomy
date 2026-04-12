import { NextResponse } from 'next/server'
import {
  DomainException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  ValidationException,
  AccessDeniedException,
  FileTooLargeException,
  ServerMisconfigurationException,
} from '../core/domain/exceptions/DomainException'

export function toHttpResponse(error: unknown): NextResponse {
  if (error instanceof AccessDeniedException) {
    return NextResponse.json(
      {
        error: 'access_denied',
        tier: error.meta.tier,
        trial_ends_at: error.meta.trialEndsAt ?? null,
        upgrade_url: error.meta.upgradeUrl,
      },
      { status: 403 },
    )
  }

  if (error instanceof UnauthorizedException) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  if (error instanceof ForbiddenException) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  if (error instanceof NotFoundException) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  if (error instanceof ConflictException) {
    return NextResponse.json({ error: error.message }, { status: 409 })
  }

  if (error instanceof ValidationException) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (error instanceof FileTooLargeException) {
    return NextResponse.json({ error: error.message }, { status: 413 })
  }

  if (error instanceof ServerMisconfigurationException) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (error instanceof DomainException) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  console.error('[Unhandled error]', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
