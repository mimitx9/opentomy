const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    const body = await res.text()
    throw new ApiError(body || res.statusText, res.status)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export function apiGet<T>(path: string, token: string): Promise<T> {
  return request<T>(path, token)
}

export function apiPost<T>(path: string, token: string, body?: unknown): Promise<T> {
  return request<T>(path, token, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export function apiDelete<T = void>(path: string, token: string): Promise<T> {
  return request<T>(path, token, { method: 'DELETE' })
}

export async function apiUpload<T>(path: string, token: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new ApiError(body || res.statusText, res.status)
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}
