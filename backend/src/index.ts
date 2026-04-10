import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'

import authRouter from './routes/auth'
import usersRouter from './routes/users'
import storageRouter from './routes/storage'
import billingRouter from './routes/billing'
import keysRouter from './routes/keys'
import chavesRouter from './routes/chaves'
import geoRouter from './routes/geo'
import paymentsRouter from './routes/payments'
import waitlistRouter from './routes/waitlist'
import lojaRouter from './routes/loja'
import agendamentoRouter from './routes/agendamento'
import pacotesRouter from './routes/pacotes'
import conteudoRouter from './routes/conteudo'

const app = express()
const PORT = process.env.PORT ?? 3001

// Security & utilities
app.use(helmet())

const allowedOrigins = [
  process.env.FRONTEND_URL ?? 'http://localhost:3000',
  'https://euthycare.com',
  'https://www.euthycare.com',
  'http://localhost:3000',
  'http://localhost:3001',
]

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sem origin (Postman, mobile, server-to-server)
      if (!origin) return callback(null, true)
      if (allowedOrigins.some(o => origin.startsWith(o))) return callback(null, true)
      // Permitir domínios Vercel do projecto
      if (origin.includes('euthycare') && origin.includes('vercel.app')) return callback(null, true)
      callback(new Error(`CORS blocked: ${origin}`))
    },
    credentials: true,
  })
)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Raw body for Stripe signature verification
app.use('/billing/webhook',  express.raw({ type: 'application/json' }))
app.use('/loja/webhook',     express.raw({ type: 'application/json' }))
app.use('/pacotes/webhook',  express.raw({ type: 'application/json' }))

app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/auth', authRouter)
app.use('/users', usersRouter)
app.use('/storage', storageRouter)
app.use('/billing', billingRouter)
app.use('/keys', keysRouter)          // legacy activation_keys system
app.use('/chaves', chavesRouter)      // new chaves_ativacao system
app.use('/geo', geoRouter)
app.use('/payments', paymentsRouter)  // dev simulation endpoints
app.use('/waitlist', waitlistRouter)
app.use('/loja', lojaRouter)
app.use('/agendamento', agendamentoRouter)
app.use('/pacotes',     pacotesRouter)
app.use('/conteudo',   conteudoRouter)

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

export default app
