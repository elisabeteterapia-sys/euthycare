import { Pool, PoolClient } from 'pg'
import { resolve4 } from 'dns/promises'
import { lookup } from 'dns'
import { URL } from 'url'

async function resolveIPv4(hostname: string): Promise<string> {
  // Try resolve4 first
  try {
    const [ip] = await resolve4(hostname)
    console.log(`[db] ${hostname} → ${ip} (resolve4)`)
    return ip
  } catch { /* continue */ }

  // Try dns.lookup with family 4
  try {
    const ip = await new Promise<string>((resolve, reject) =>
      lookup(hostname, { family: 4 }, (err, addr) => err ? reject(err) : resolve(addr))
    )
    console.log(`[db] ${hostname} → ${ip} (lookup family:4)`)
    return ip
  } catch { /* continue */ }

  console.warn(`[db] IPv4 resolution failed for ${hostname}, using hostname`)
  return hostname
}

async function createPool(): Promise<Pool> {
  const connStr = process.env.DATABASE_URL
  if (!connStr) throw new Error('DATABASE_URL is not set')

  const url = new URL(connStr)
  const hostname = url.hostname
  const host = await resolveIPv4(hostname)

  return new Pool({
    host,
    port: parseInt(url.port) || 5432,
    database: url.pathname.replace(/^\//, ''),
    user: url.username,
    password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: false, servername: hostname },
    max: 5,
  })
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
