import { getToken } from './auth'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Request failed')
  return data as T
}

// ─── Users ───────────────────────────────────────────────────
export const users = {
  me: () => request<{ id: string; email: string; name: string; plan: string; currency_preference: string }>('/users/me'),
  update: (patch: { name?: string; avatar_url?: string; currency_preference?: string }) =>
    request('/users/me', { method: 'PATCH', body: JSON.stringify(patch) }),
}

// ─── Storage ─────────────────────────────────────────────────
export const storage = {
  upload: async (file: File) => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API}/storage/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) throw new Error('Upload failed')
    return res.json() as Promise<{ path: string; url: string }>
  },
  list: () => request<Array<{ name: string; path: string; url: string; size: number }>>('/storage/list'),
  delete: (filePath: string) => request(`/storage/${filePath}`, { method: 'DELETE' }),
}

// ─── Billing ─────────────────────────────────────────────────
export const billing = {
  plans: (currency?: string) =>
    request<{
      currency: string
      plans: Array<{ id: string; name: string; displayPrice: number; displayCurrency: string; interval: string; features: string[] }>
    }>(`/billing/plans${currency ? `?currency=${currency}` : ''}`),

  checkout: (planId: string, currency?: string) =>
    request<{ url: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId, currency }),
    }),

  portal: () => request<{ url: string }>('/billing/portal'),
  subscription: () => request<{ plan: string; stripeSubscriptionId: string | null }>('/billing/subscription'),
}

// ─── Geo ─────────────────────────────────────────────────────
export const geo = {
  currency: () => request<{ currency: string; country?: string; source: string }>('/geo/currency'),
  rates: () => request<{ base: string; rates: Record<string, number> }>('/geo/rates'),
  currencies: () => request<Array<{ code: string; symbol: string; name: string }>>('/geo/currencies'),
}
