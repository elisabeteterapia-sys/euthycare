const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Request failed')
  return data as T
}

export async function signUp(email: string, password: string, name?: string) {
  return post('/auth/signup', { email, password, name })
}

export async function signIn(email: string, password: string) {
  const data = await post<{ access_token: string; refresh_token: string; user: { id: string; email: string } }>(
    '/auth/signin',
    { email, password }
  )
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
  }
  return data
}

export async function signOut() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  if (token) {
    await fetch(`${API}/auth/signout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null)
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
