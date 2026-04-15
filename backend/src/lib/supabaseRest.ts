/**
 * Direct REST calls to Supabase — bypasses PostgREST schema cache entirely.
 * Use when supabaseAdmin fails with "Could not find table in schema cache".
 */

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

function headers() {
  return {
    'apikey':        SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
  }
}

export async function restInsert(table: string, row: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: headers(),
    body:    JSON.stringify(row),
  })
  const json = await res.json()
  if (!res.ok) return { data: null, error: json }
  const data = Array.isArray(json) ? json[0] : json
  return { data, error: null }
}

export async function restUpdate(table: string, id: string, row: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method:  'PATCH',
    headers: headers(),
    body:    JSON.stringify(row),
  })
  const json = await res.json()
  if (!res.ok) return { data: null, error: json }
  const data = Array.isArray(json) ? json[0] : json
  return { data, error: null }
}

export async function restDelete(table: string, id: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method:  'DELETE',
    headers: { ...headers(), Prefer: '' },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    return { error: json }
  }
  return { error: null }
}
