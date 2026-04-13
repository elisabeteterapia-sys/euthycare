import { Pool } from 'pg'
import dns from 'dns'

// Force IPv4 — Railway resolves Supabase to IPv6 which is unreachable
dns.setDefaultResultOrder('ipv4first')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

export default pool
