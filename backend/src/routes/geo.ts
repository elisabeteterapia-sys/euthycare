import { Router, Request, Response, NextFunction } from 'express'
import { currencyForCountry, CURRENCIES, SUPPORTED_CURRENCY_CODES } from '../lib/currencies'
import { getExchangeRates, getMoedas, syncRatesFromApi } from '../lib/exchange-rates'

const router = Router()

// ─── Admin guard (reutilizado do routes/keys.ts) ───────────────
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  next()
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return req.socket.remoteAddress ?? '127.0.0.1'
}

// GET /geo/currency — detecta moeda pelo IP ou aceita override
router.get('/currency', async (req: Request, res: Response) => {
  const override = req.query.currency as string | undefined

  if (override && CURRENCIES[override.toUpperCase()]) {
    res.json({ currency: override.toUpperCase(), source: 'override' })
    return
  }

  const ip = getClientIp(req)
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')

  if (isLocal) {
    res.json({ currency: 'EUR', source: 'default' })
    return
  }

  try {
    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`)
    if (!geoRes.ok) throw new Error('Geo lookup failed')

    const geo = (await geoRes.json()) as { country_code?: string; currency?: string }
    const detected = geo.currency ?? currencyForCountry(geo.country_code ?? '')
    const supported = SUPPORTED_CURRENCY_CODES.includes(detected) ? detected : 'EUR'

    res.json({ currency: supported, country: geo.country_code, source: 'geo' })
  } catch {
    res.json({ currency: 'EUR', source: 'default' })
  }
})

// GET /geo/moedas — lista completa da tabela moedas (com campo stale)
router.get('/moedas', async (_req: Request, res: Response) => {
  try {
    const moedas = await getMoedas()
    res.json(moedas)
  } catch {
    res.status(503).json({ error: 'Moedas indisponíveis' })
  }
})

// GET /geo/rates — taxas em formato simplificado { base, rates }
router.get('/rates', async (_req: Request, res: Response) => {
  try {
    const rates = await getExchangeRates()
    res.json({ base: 'EUR', rates })
  } catch {
    res.status(503).json({ error: 'Taxas de câmbio indisponíveis' })
  }
})

// POST /geo/rates/sync — sincroniza taxas com frankfurter.app e persiste no DB
// Chamado pelo cron ou manualmente pelo admin
router.post('/rates/sync', requireAdmin, async (_req: Request, res: Response) => {
  const result = await syncRatesFromApi()
  const status = result.error ? 207 : 200   // 207 = partial success
  res.status(status).json(result)
})

// GET /geo/currencies — lista estática de moedas suportadas (sem DB)
router.get('/currencies', (_req: Request, res: Response) => {
  res.json(
    Object.values(CURRENCIES).map(({ code, symbol, name, locale }) => ({
      code, symbol, name, locale,
    }))
  )
})

export default router
