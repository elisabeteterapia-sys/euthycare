import { Pool, PoolClient } from 'pg'
import { resolve4 } from 'dns/promises'
import { URL } from 'url'

async function createPool(): Promise<Pool> {
  const connStr = process.env.DATABASE_URL
  if (!connStr) throw new Error('DATABASE_URL is not set')

  try {
    const url = new URL(connStr)
    const hostname = url.hostname
    // Force IPv4 — Supabase pooler has A records but Railway may resolve AAAA first
    const [ipv4] = await resolve4(hostname)
    console.log(`[db] ${hostname} → ${ipv4} (IPv4)`)
    return new Pool({
      host: ipv4,
      port: parseInt(url.port) || 5432,
      database: url.pathname.replace(/^\//, ''),
      user: url.username,
      password: decodeURIComponent(url.password),
      ssl: { rejectUnauthorized: false, servername: hostname },
      max: 5,
    })
  } catch (e) {
    console.warn('[db] IPv4 resolve failed, retrying with family:4:', (e as Error).message)
    return new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false }, family: 4 })
  }
}

const poolPromise = createPool()

export async function pgQuery(sql: string, params: unknown[] = []) {
  let client: PoolClient | undefined
  try {
    const pool = await poolPromise
    client = await pool.connect()
    const res = await client.query(sql, params)
    return { rows: res.rows, error: null }
  } catch (e) {
    return { rows: [], error: (e as Error).message }
  } finally {
    client?.release()
  }
}
