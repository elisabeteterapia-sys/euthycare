import { supabaseAdmin } from './supabase'
import { BASE_CURRENCY, SUPPORTED_CURRENCY_CODES } from './currencies'

// ─── Types ────────────────────────────────────────────────────

export interface MoedaRow {
  codigo: string
  simbolo: string
  nome: string
  taxa_conversao: number
  atualizado_em: string
  stale?: boolean
}

// ─── In-process cache (evita round-trips ao DB em rajadas) ───
const CACHE_TTL_MS = 5 * 60 * 1000   // 5 min — o DB é a fonte real

interface Cache {
  rates: Record<string, number>
  fetchedAt: number
}

let cache: Cache | null = null

function isCacheFresh(): boolean {
  return !!cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS
}

// ─── Leitura da tabela ────────────────────────────────────────

/** Lê as taxas da tabela `moedas`. EUR sempre = 1. */
export async function getExchangeRates(): Promise<Record<string, number>> {
  if (isCacheFresh()) return cache!.rates

  const { data, error } = await supabaseAdmin
    .from('moedas')
    .select('codigo, taxa_conversao')

  if (error || !data?.length) {
    // DB indisponível: usa cache antigo ou fallback estático
    if (cache) return cache.rates
    return { EUR: 1, USD: 1.08, BRL: 5.42 }
  }

  const rates: Record<string, number> = {}
  for (const row of data) {
    rates[row.codigo] = Number(row.taxa_conversao)
  }
  rates[BASE_CURRENCY] = 1   // garante que EUR = 1 sempre

  cache = { rates, fetchedAt: Date.now() }
  return rates
}

/** Retorna todas as linhas completas da tabela `moedas`. */
export async function getMoedas(): Promise<MoedaRow[]> {
  const { data, error } = await supabaseAdmin
    .from('moedas_status')   // view com campo `stale`
    .select('*')

  if (error) throw new Error(`Erro ao buscar moedas: ${error.message}`)
  return (data ?? []) as MoedaRow[]
}

// ─── Sincronização com API externa (frankfurter.app) ─────────
// Chamada pelo cron job ou manualmente via POST /geo/rates/sync

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest'

export async function syncRatesFromApi(): Promise<{
  updated: string[]
  skipped: string[]
  error?: string
}> {
  const targets = SUPPORTED_CURRENCY_CODES.filter((c) => c !== BASE_CURRENCY).join(',')

  let json: { rates: Record<string, number> }
  try {
    const res = await fetch(`${FRANKFURTER_URL}?from=${BASE_CURRENCY}&to=${targets}`)
    if (!res.ok) throw new Error(res.statusText)
    json = await res.json() as { rates: Record<string, number> }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { updated: [], skipped: SUPPORTED_CURRENCY_CODES, error: msg }
  }

  const updated: string[] = []
  const skipped: string[] = []

  for (const [codigo, taxa] of Object.entries(json.rates)) {
    if (!SUPPORTED_CURRENCY_CODES.includes(codigo)) continue

    const { error } = await supabaseAdmin
      .from('moedas')
      .update({ taxa_conversao: taxa })   // trigger atualiza atualizado_em
      .eq('codigo', codigo)

    if (error) skipped.push(codigo)
    else updated.push(codigo)
  }

  // Invalida cache local para próxima leitura buscar do DB
  cache = null

  return { updated, skipped }
}

// ─── Conversão ────────────────────────────────────────────────

/** Converte de EUR (base) para a moeda alvo. Retorna centavos inteiros. */
export async function convertFromBase(
  amountCents: number,
  targetCurrency: string
): Promise<number> {
  const rates = await getExchangeRates()
  const rate = rates[targetCurrency.toUpperCase()] ?? 1
  return Math.round(amountCents * rate)
}

/** Converte de qualquer moeda de volta para EUR (centavos inteiros). */
export async function convertToBase(
  amountCents: number,
  fromCurrency: string
): Promise<number> {
  const rates = await getExchangeRates()
  const rate = rates[fromCurrency.toUpperCase()] ?? 1
  return Math.round(amountCents / rate)
}
