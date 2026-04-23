/**
 * famaster.ts — Server-side API client for the famaster Go backend.
 *
 * Authentication: each request carries
 *   Authorization: Bearer <FAMASTER_API_SECRET>
 *   X-User-ID: <internal userId from NextAuth session>
 *
 * This module is ONLY used in Next.js API route handlers (server side).
 * Never import it in client components.
 */

const BASE_URL = (process.env.FAMASTER_API_URL ?? '').replace(/\/$/, '')
const API_SECRET = process.env.FAMASTER_API_SECRET ?? ''

export class FamasterError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'FamasterError'
  }
}

interface FamasterOptions extends Omit<RequestInit, 'headers'> {
  userId?: string
  email?: string
  name?: string | null
  headers?: Record<string, string>
}

async function call<T>(path: string, options: FamasterOptions = {}): Promise<T> {
  const { userId, email, name, headers: extraHeaders, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_SECRET}`,
    ...extraHeaders,
  }
  if (userId) headers['X-User-ID'] = userId
  if (email) headers['X-User-Email'] = email
  if (name) headers['X-User-Name'] = name

  const res = await fetch(`${BASE_URL}/famaster/v1/opentomy${path}`, { ...rest, headers })

  if (!res.ok) {
    const body = await res.text()
    throw new FamasterError(body || res.statusText, res.status)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

// ─── Files ─────────────────────────────────────────────────────────────────────

export function getPublicFiles(params: { page?: number; limit?: number; search?: string }) {
  const q = new URLSearchParams()
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  if (params.search) q.set('search', params.search)
  return call<{ data: unknown[]; total: number; page: number; limit: number; has_more: boolean }>(
    `/files?${q}`,
  )
}

export function getMyFiles(userId: string) {
  return call<{ data: unknown[]; total: number }>('/files/mine', { userId })
}

export function getFile(fileId: string, userId?: string) {
  return call<Record<string, unknown>>(`/files/${fileId}`, { userId })
}

export function deleteFile(fileId: string, userId: string, role: string) {
  return call<{ success: boolean }>(`/files/${fileId}`, {
    method: 'DELETE',
    userId,
    headers: { 'X-User-Role': role },
  })
}

export function getSubjects(fileId: string, userId?: string) {
  return call<unknown[]>(`/files/${fileId}/subjects`, { userId })
}

export function getSystems(fileId: string, userId?: string) {
  return call<unknown[]>(`/files/${fileId}/systems`, { userId })
}

export function getQuestions(
  fileId: string,
  userId: string | undefined,
  body: { subjectIds?: number[]; systems?: string[]; limit?: number; shuffle?: boolean },
) {
  return call<unknown[]>(`/files/${fileId}/questions`, {
    method: 'POST',
    userId,
    body: JSON.stringify(body),
  })
}

// ─── Attempts ─────────────────────────────────────────────────────────────────

export function submitAttempt(
  userId: string,
  body: { file_id: string; score: number; max_score: number; answers: unknown },
) {
  return call<unknown>('/attempts', {
    method: 'POST',
    userId,
    body: JSON.stringify(body),
  })
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export function getSubscriptionStatus(userId: string) {
  return call<{
    subscription: unknown
    tier: string
    status: string | null
    trial_ends_at: string | null
    can_decrypt: boolean
  }>('/subscription/status', { userId })
}

export function createCheckout(
  userId: string,
  email: string,
  name: string | undefined | null,
  body: { price_id: string; success_url: string; cancel_url: string },
) {
  return call<{ checkout_url: string }>('/subscription/checkout', {
    method: 'POST',
    userId,
    email,
    name,
    body: JSON.stringify({ ...body, email, name }),
  })
}

export function createPortal(userId: string, returnURL: string) {
  return call<{ portal_url: string }>('/subscription/portal', {
    method: 'POST',
    userId,
    body: JSON.stringify({ return_url: returnURL }),
  })
}

export function stripeWebhook(rawBody: string, signature: string) {
  return call<{ received: boolean }>('/webhooks/stripe', {
    method: 'POST',
    headers: { 'Stripe-Signature': signature, 'Content-Type': 'text/plain' },
    body: rawBody,
  })
}
