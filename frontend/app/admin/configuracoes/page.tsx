'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'

type Tab = 'geral' | 'terapeuta' | 'pagamentos' | 'notificacoes'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

type Conteudo = Record<string, string>

export default function AdminConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>('geral')
  const [dados, setDados] = useState<Conteudo>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`${API}/conteudo`)
      .then(r => r.json())
      .then(d => { if (typeof d === 'object') setDados(d) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  function set(chave: string, valor: string) {
    setDados(prev => ({ ...prev, [chave]: valor }))
  }

  async function guardar(chaves: string[]) {
    setSaving(true)
    try {
      await Promise.all(chaves.map(chave =>
        fetch(`${API}/conteudo/${chave}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
          body: JSON.stringify({ valor: dados[chave] ?? 'false' }),
        })
      ))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'geral',        label: 'Geral' },
    { id: 'terapeuta',    label: 'Terapeuta' },
    { id: 'pagamentos',   label: 'Pagamentos' },
    { id: 'notificacoes', label: 'Notificações' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar…
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-400 mt-1">Definições globais do site</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-200 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'geral' && (
        <Card className="space-y-5 max-w-2xl">
          <h2 className="font-semibold text-gray-800">Informações do site</h2>
          <Field label="Nome do site"       value={dados['geral_nome_site'] ?? ''} onChange={v => set('geral_nome_site', v)} />
          <Field label="Slogan"             value={dados['geral_slogan'] ?? ''}    onChange={v => set('geral_slogan', v)} />
          <Field label="Email de contacto"  value={dados['geral_email'] ?? ''}     onChange={v => set('geral_email', v)} type="email" />
          <Field label="Telefone"           value={dados['geral_telefone'] ?? ''}  onChange={v => set('geral_telefone', v)} />
          <SaveButton saving={saving} saved={saved} onClick={() => guardar(['geral_nome_site','geral_slogan','geral_email','geral_telefone'])} />
        </Card>
      )}

      {tab === 'terapeuta' && (
        <Card className="space-y-5 max-w-2xl">
          <h2 className="font-semibold text-gray-800">Perfil da terapeuta</h2>
          <Field label="Nome completo"       value={dados['terapeuta_nome'] ?? ''}   onChange={v => set('terapeuta_nome', v)} />
          <Field label="Título profissional" value={dados['terapeuta_titulo'] ?? ''} onChange={v => set('terapeuta_titulo', v)} />
          <Field label="Número de cédula"    value={dados['terapeuta_cedula'] ?? ''} onChange={v => set('terapeuta_cedula', v)} />
          <Field label="Biografia"           value={dados['terapeuta_bio'] ?? ''}    onChange={v => set('terapeuta_bio', v)} textarea />
          <Field label="Anos de experiência" value={dados['terapeuta_anos'] ?? ''}   onChange={v => set('terapeuta_anos', v)} type="number" />
          <Field label="Duração da sessão (min)" value={dados['terapeuta_duracao'] ?? '50'} onChange={v => set('terapeuta_duracao', v)} type="number" />
          <SaveButton saving={saving} saved={saved} onClick={() => guardar(['terapeuta_nome','terapeuta_titulo','terapeuta_cedula','terapeuta_bio','terapeuta_anos','terapeuta_duracao'])} />
        </Card>
      )}

      {tab === 'pagamentos' && (
        <Card className="space-y-5 max-w-2xl">
          <h2 className="font-semibold text-gray-800">Pagamentos</h2>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            Para alterar os preços reais, aceda ao painel Stripe e actualize os preços lá.
          </div>
          <Field label="Stripe Public Key"   value={dados['stripe_public_key'] ?? ''}  onChange={v => set('stripe_public_key', v)} />
          <SaveButton saving={saving} saved={saved} onClick={() => guardar(['stripe_public_key'])} />
        </Card>
      )}

      {tab === 'notificacoes' && (
        <Card className="space-y-5 max-w-2xl">
          <h2 className="font-semibold text-gray-800">Notificações por email</h2>
          <p className="text-sm text-gray-500">As notificações serão enviadas para <strong>{dados['geral_email'] || 'suporte@euthycare.com'}</strong>.</p>
          {[
            { label: 'Novo agendamento',            chave: 'notif_agendamento' },
            { label: 'Novo inscrito lista de espera', chave: 'notif_waitlist' },
            { label: 'Pagamento recebido',           chave: 'notif_pagamento' },
            { label: 'Agendamento cancelado',        chave: 'notif_cancelamento' },
          ].map(n => (
            <div key={n.chave} className="flex items-center gap-4">
              <button
                onClick={() => set(n.chave, (dados[n.chave] ?? 'false') === 'true' ? 'false' : 'true')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${dados[n.chave] === 'true' ? 'bg-sage-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${dados[n.chave] === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <p className="text-sm text-gray-800">{n.label}</p>
            </div>
          ))}
          <SaveButton saving={saving} saved={saved} onClick={() => guardar(['notif_agendamento','notif_waitlist','notif_pagamento','notif_cancelamento'])} />
        </Card>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', textarea = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none" />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400" />
      )}
    </div>
  )
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <div className="pt-2">
      <Button size="sm" onClick={onClick} disabled={saving} className="gap-2">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar…</> :
         saved  ? <><Check className="h-4 w-4" /> Guardado!</> :
         'Guardar alterações'}
      </Button>
    </div>
  )
}
