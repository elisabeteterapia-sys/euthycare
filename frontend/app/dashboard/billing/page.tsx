'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  RefreshCw, ExternalLink, CreditCard, Zap, ShieldCheck,
  Brain, Database, FileDown, Users, CheckCircle2, ArrowRight,
  Phone, Clock, AlertTriangle, XCircle, RotateCcw, Copy,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getPlanPermissions, PLAN_DEFINITIONS,
  type PlanId, iaNivelLabel, backupTipoLabel,
} from '@/lib/permissions'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// ── Types ─────────────────────────────────────────────────────

interface Subscription {
  plan: string
  planDetails: {
    id: string; nome: string; tipo: string
    limite_terapeutas: number; ia_nivel: string; tem_backup: boolean
    tipo_backup: string; exportacao_total: boolean
    preco_mensal_eur: number; preco_anual_eur: number
  } | null
  subscriptionStatus: 'inactive' | 'trialing' | 'active' | 'past_due' | 'cancelled'
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  currencyPreference: string
  isTrialing: boolean
  trialEndsAt: string | null
  trialDaysLeft: number | null
  planExpiresAt: string | null
  activationKey: { codigo: string; tipo: string; expiresAt: string | null; usedAt: string | null } | null
}

interface ApiPlan {
  id: string; nome: string; tipo: string
  preco_mensal_eur: number; preco_anual_eur: number
  desconto_anual_pct: number; features: string[]
  contato_comercial: boolean
  pricing?: { formatted: string; annualFormatted: string }
}

// ── Helpers ───────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function post(path: string, body: object) {
  const res = await fetch(`${API}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body:    JSON.stringify(body),
  })
  return res.json()
}

// ── Sub-components ────────────────────────────────────────────

function PermRow({ label, icon: Icon, allowed, detail }: {
  label: string; icon: React.ElementType; allowed: boolean; detail?: string
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-cream-300 last:border-0">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Icon className="h-4 w-4 text-gray-400" />
        {label}
      </div>
      <div className="flex items-center gap-2">
        {detail && <span className="text-xs text-gray-400">{detail}</span>}
        <Badge variant={allowed ? 'sage' : 'cream'} className="text-xs">
          {allowed ? 'Activo' : 'Bloqueado'}
        </Badge>
      </div>
    </div>
  )
}

function TrialBanner({ daysLeft, endsAt }: { daysLeft: number; endsAt: string }) {
  const urgent = daysLeft <= 3
  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${urgent ? 'bg-amber-50 border-amber-200' : 'bg-sage-50 border-sage-200'}`}>
      <Clock className={`h-5 w-5 flex-shrink-0 mt-0.5 ${urgent ? 'text-amber-500' : 'text-sage-500'}`} />
      <div>
        <p className={`font-semibold text-sm ${urgent ? 'text-amber-700' : 'text-sage-700'}`}>
          {urgent ? `⚠️ Trial expira em ${daysLeft} dias` : `${daysLeft} dias de trial restantes`}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Expira em {new Date(endsAt).toLocaleDateString('pt-PT')}. Adicione um método de pagamento para continuar.
        </p>
      </div>
    </div>
  )
}

function PastDueBanner() {
  return (
    <div className="rounded-2xl border bg-red-50 border-red-200 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-500" />
      <div>
        <p className="font-semibold text-sm text-red-700">Pagamento em falta</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Não foi possível processar o pagamento. Actualize o seu método de pagamento.
        </p>
      </div>
    </div>
  )
}

function CancelledBanner({ expiresAt }: { expiresAt: string }) {
  return (
    <div className="rounded-2xl border bg-cream-200 border-cream-400 p-4 flex items-start gap-3">
      <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-gray-400" />
      <div>
        <p className="font-semibold text-sm text-gray-700">Assinatura cancelada</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Mantém acesso até {new Date(expiresAt).toLocaleDateString('pt-PT')}.
        </p>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────

export default function BillingPage() {
  const [sub,          setSub]          = useState<Subscription | null>(null)
  const [plans,        setPlans]        = useState<ApiPlan[]>([])
  const [copied,       setCopied]       = useState(false)
  const [loading,      setLoading]      = useState(true)
  const [interval,     setIntervalMode] = useState<'month' | 'year'>('month')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [confirm,      setConfirm]      = useState<'cancel' | 'downgrade' | null>(null)

  function reload() {
    setLoading(true)
    Promise.all([
      fetch(`${API}/billing/subscription`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${API}/billing/plans?currency=EUR`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([subData, plansData]) => {
        setSub(subData)
        setPlans(plansData.plans ?? [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(reload, [])

  function copyKey() {
    if (!sub?.activationKey) return
    navigator.clipboard.writeText(sub.activationKey.codigo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleCheckout(planId: string) {
    const plan = plans.find((p) => p.id === planId)
    if (plan?.contato_comercial) {
      window.location.href = '/contato?assunto=Enterprise'
      return
    }
    setActionLoading(`checkout-${planId}`)
    try {
      const data = await post('/billing/checkout', {
        planId,
        currency: sub?.currencyPreference ?? 'EUR',
        interval,
      })
      if (data.needsCommercialContact) window.location.href = data.contactUrl ?? '/contato?assunto=Enterprise'
      else if (data.url)              window.location.href = data.url
      else if (data.error)            alert(data.error)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleUpgrade(planId: string) {
    setActionLoading(`upgrade-${planId}`)
    try {
      const data = await post('/billing/upgrade', { newPlanId: planId, interval, timing: 'immediate' })
      if (data.error) alert(data.error)
      else reload()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancel() {
    setActionLoading('cancel')
    setConfirm(null)
    try {
      const data = await post('/billing/cancel', { timing: 'end_of_period', reason: 'user_requested' })
      if (data.error) alert(data.error)
      else reload()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReactivate() {
    setActionLoading('reactivate')
    try {
      const data = await post('/billing/reactivate', {})
      if (data.error) alert(data.error)
      else reload()
    } finally {
      setActionLoading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch(`${API}/billing/portal`, { headers: authHeaders() })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-sage-400" />
      </div>
    )
  }

  const currentPlanId  = sub?.plan ?? 'essencial'
  const planDef        = PLAN_DEFINITIONS[currentPlanId as PlanId]
  const permissions    = getPlanPermissions(currentPlanId)
  const status         = sub?.subscriptionStatus ?? 'inactive'
  const isCancelled    = status === 'cancelled'
  const isPastDue      = status === 'past_due'
  const isTrialing     = sub?.isTrialing ?? false
  const hasActiveSubscription = sub?.stripeSubscriptionId != null

  // Plans available to switch to
  const otherPlans = plans.filter(
    (p) => p.id !== currentPlanId && p.tipo !== 'enterprise'
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assinatura e cobrança</h1>
        <p className="text-sm text-gray-400 mt-1">Gerencie o seu plano, permissões e faturação</p>
      </div>

      {/* ── Status banners ──────────────────────────────────── */}
      {isTrialing && sub?.trialEndsAt && sub.trialDaysLeft !== null && (
        <TrialBanner daysLeft={sub.trialDaysLeft} endsAt={sub.trialEndsAt} />
      )}
      {isPastDue && <PastDueBanner />}
      {isCancelled && sub?.planExpiresAt && (
        <CancelledBanner expiresAt={sub.planExpiresAt} />
      )}

      {/* ── Plano atual ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plano atual</CardTitle>
              <CardDescription>O seu plano EuthyCare</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isTrialing && <Badge variant="lilac">Em trial</Badge>}
              {isCancelled && <Badge variant="cream">Cancelado</Badge>}
              {isPastDue  && <Badge className="bg-red-100 text-red-600 border-red-200">Pagamento em falta</Badge>}
              {status === 'active' && <Badge variant="sage">Ativo</Badge>}
              <Badge variant="sage" className="text-sm px-3 py-1">
                {planDef?.nome ?? currentPlanId}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sub?.stripeSubscriptionId ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4 text-sage-400" />
              Stripe ID: <code className="text-xs bg-cream-300 px-1.5 py-0.5 rounded">{sub.stripeSubscriptionId.slice(0, 24)}…</code>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Sem assinatura Stripe ativa.</p>
          )}

          {planDef && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="text-xs text-center bg-cream-100 rounded-xl p-3 border border-cream-300">
                <p className="text-gray-400 mb-0.5">Terapeutas</p>
                <p className="font-semibold text-gray-700">
                  {planDef.limite_terapeutas === 999 ? 'Ilimitados' : `até ${planDef.limite_terapeutas}`}
                </p>
              </div>
              <div className="text-xs text-center bg-cream-100 rounded-xl p-3 border border-cream-300">
                <p className="text-gray-400 mb-0.5">IA</p>
                <p className="font-semibold text-gray-700">{iaNivelLabel(planDef.ia_nivel as any)}</p>
              </div>
              <div className="text-xs text-center bg-cream-100 rounded-xl p-3 border border-cream-300">
                <p className="text-gray-400 mb-0.5">Backup</p>
                <p className="font-semibold text-gray-700">{backupTipoLabel(planDef.tipo_backup as any)}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 flex-wrap">
          {hasActiveSubscription && !isCancelled && (
            <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading} className="gap-2">
              {portalLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
              Gerir no Stripe
            </Button>
          )}
          {isCancelled && sub?.stripeSubscriptionId && (
            <Button size="sm" onClick={handleReactivate} disabled={!!actionLoading} className="gap-2">
              {actionLoading === 'reactivate' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Reativar assinatura
            </Button>
          )}
          {hasActiveSubscription && !isCancelled && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => setConfirm('cancel')}
              disabled={!!actionLoading}
            >
              Cancelar assinatura
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Cancel confirmation */}
      {confirm === 'cancel' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700 mb-1">Confirmar cancelamento</p>
          <p className="text-sm text-gray-500 mb-4">
            A assinatura é cancelada no fim do período atual. Continuará com acesso até lá.
          </p>
          <div className="flex gap-3">
            <Button size="sm" onClick={handleCancel} disabled={actionLoading === 'cancel'} className="bg-red-600 hover:bg-red-700 text-white gap-2">
              {actionLoading === 'cancel' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
              Confirmar cancelamento
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirm(null)}>
              Manter assinatura
            </Button>
          </div>
        </div>
      )}

      {/* ── Permissões ───────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Permissões do plano</CardTitle>
          <CardDescription>Funcionalidades incluídas no plano {planDef?.nome}</CardDescription>
        </CardHeader>
        <CardContent>
          <PermRow label="IA integrada"      icon={Brain}    allowed={permissions.canAccessIA}     detail={planDef ? iaNivelLabel(planDef.ia_nivel as any) : undefined} />
          <PermRow label="Backup automático" icon={Database}  allowed={permissions.canUseBackup}    detail={planDef ? backupTipoLabel(planDef.tipo_backup as any) : undefined} />
          <PermRow label="Exportação total"  icon={FileDown}  allowed={permissions.canExportAll} />
          <PermRow label="Download por paciente" icon={FileDown} allowed={permissions.canDownloadPerClient} />
          <PermRow
            label="Multi-terapeutas"
            icon={Users}
            allowed={permissions.isClinica}
            detail={permissions.isClinica ? `até ${permissions.maxTherapists}` : '1 terapeuta'}
          />
        </CardContent>
        {!permissions.canUseFullIA && (
          <CardFooter>
            <Link href="/venda">
              <Button size="sm" variant="outline" className="gap-2">
                Ver planos com mais funcionalidades <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>

      {/* ── Chave de ativação ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-sage-400" />
            Chave de ativação
          </CardTitle>
          <CardDescription>Gerada após o pagamento. Use para activar noutros dispositivos.</CardDescription>
        </CardHeader>
        <CardContent>
          {sub?.activationKey ? (
            <div>
              <div className="flex items-center gap-2 bg-cream-200 rounded-xl px-4 py-3 font-mono text-sm">
                <span className="flex-1 tracking-widest text-gray-800">{sub.activationKey.codigo}</span>
                <button onClick={copyKey} className="text-sage-500 hover:text-sage-700 transition-colors">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              {copied && <p className="text-xs text-sage-600 mt-1 font-medium">Copiado!</p>}
              <p className="text-xs text-gray-400 mt-2">
                Tipo: <span className="font-medium">{sub.activationKey.tipo}</span>
                {sub.activationKey.expiresAt && ` · Expira em ${new Date(sub.activationKey.expiresAt).toLocaleDateString('pt-PT')}`}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {status === 'inactive' || status === 'cancelled'
                ? 'Chaves disponíveis nos planos pagos ativos.'
                : 'Nenhuma chave ainda. Complete um checkout primeiro.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Mudar de plano ────────────────────────────────────── */}
      {otherPlans.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {hasActiveSubscription ? 'Mudar de plano' : 'Escolher plano'}
            </h2>
            <div className="flex items-center gap-1 bg-cream-200 rounded-xl p-1">
              {(['month', 'year'] as const).map((i) => (
                <button
                  key={i}
                  onClick={() => setIntervalMode(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    interval === i ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
                  }`}
                >
                  {i === 'month' ? 'Mensal' : 'Anual'}
                  {i === 'year' && <span className="ml-1 text-sage-600">-17%</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {otherPlans.map((plan) => {
              const monthlyPrice = interval === 'year'
                ? (plan.preco_anual_eur / 12).toFixed(0)
                : plan.preco_mensal_eur
              const isUpgrade = plan.preco_mensal_eur > (planDef?.preco_mensal_eur ?? 0)
              const actionId = hasActiveSubscription ? `upgrade-${plan.id}` : `checkout-${plan.id}`
              const isLoading = actionLoading === actionId

              return (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{plan.nome}</CardTitle>
                      <div className="text-right">
                        {plan.contato_comercial ? (
                          <span className="text-sm font-semibold text-gray-500">Sob consulta</span>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-gray-900">€{monthlyPrice}</span>
                            <span className="text-xs text-gray-400">/mês</span>
                            {interval === 'year' && (
                              <p className="text-xs text-sage-600">€{plan.preco_anual_eur}/ano</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {plan.tipo === 'clinica' && (
                      <Badge variant="lilac" className="self-start mt-1 text-xs">Até 10 terapeutas</Badge>
                    )}
                    <Badge variant={isUpgrade ? 'sage' : 'cream'} className="self-start text-xs">
                      {isUpgrade ? '↑ Upgrade' : '↓ Downgrade'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {plan.features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="h-3.5 w-3.5 text-sage-400 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {plan.contato_comercial ? (
                      <Link href="/contato?assunto=Enterprise" className="w-full">
                        <Button variant="outline" className="w-full gap-2">
                          <Phone className="h-4 w-4" /> Contactar comercial
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        disabled={!!actionLoading}
                        onClick={() => hasActiveSubscription ? handleUpgrade(plan.id) : handleCheckout(plan.id)}
                      >
                        {isLoading
                          ? <RefreshCw className="h-4 w-4 animate-spin" />
                          : <CreditCard className="h-4 w-4" />
                        }
                        {hasActiveSubscription
                          ? (isUpgrade ? 'Fazer upgrade' : 'Fazer downgrade')
                          : 'Assinar agora'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {/* Enterprise strip */}
          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-700 text-sm">Mais de 10 terapeutas?</p>
              <p className="text-xs text-gray-400">Plano Enterprise com condições personalizadas</p>
            </div>
            <Link href="/contato?assunto=Enterprise">
              <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
                <Phone className="h-3.5 w-3.5" /> Contactar comercial
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
