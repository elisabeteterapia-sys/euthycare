const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }

  return res.json() as Promise<T>
}

// ─── Auth ────────────────────────────────────────────────────
export const auth = {
  signUp: (email: string, password: string, name?: string) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  signIn: async (email: string, password: string) => {
    const data = await request<{ access_token: string; refresh_token: string; user: object }>(
      '/auth/signin',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    )
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    return data
  },

  signOut: async () => {
    await request('/auth/signout', { method: 'POST' }).catch(() => null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  refresh: async () => {
    const refresh_token = localStorage.getItem('refresh_token')
    if (!refresh_token) throw new Error('No refresh token')
    const data = await request<{ access_token: string; refresh_token: string }>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refresh_token }) }
    )
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    return data
  },
}

// ─── Users ───────────────────────────────────────────────────
export const users = {
  me: () => request('/users/me'),
  updateMe: (patch: { name?: string; avatar_url?: string }) =>
    request('/users/me', { method: 'PATCH', body: JSON.stringify(patch) }),
}

// ─── Storage ─────────────────────────────────────────────────
export const storage = {
  upload: async (file: File) => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/storage/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) throw new Error('Upload failed')
    return res.json() as Promise<{ path: string; url: string }>
  },

  list: () => request<Array<{ name: string; path: string; url: string; size: number }>>('/storage/list'),

  delete: (filePath: string) =>
    request(`/storage/${filePath}`, { method: 'DELETE' }),
}
