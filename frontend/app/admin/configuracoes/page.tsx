'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

type Tab = 'geral' | 'terapeuta' | 'pagamentos' | 'notificacoes'

export default function AdminConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>('geral')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'geral',         label: 'Geral' },
    { id: 'terapeuta',     label: 'Terapeuta' },
    { id: 'pagamentos',    label: 'Pagamentos' },
    { id: 'notificacoes',  label: 'Notificações' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-400 mt-1">Definições globais do site</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-200 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'geral' && (
        <Card className="space-y-5 max-w-2xl">
          <h2 className="font-semibold text-gray-800">Informações do site</h2>
          <Field label="Nome do site" defaultValue="Euthycare" />
          <Field label="Slogan" defaultValue="Cuidado mental acolhedor e acessível" />
          <Field label="Email de contacto" defaultValue="hello@euthycare.com" type="email" />
          <Field label="Telefone" defaultValue="+351 910 000 000" />
          <Field label="URL do site" defaultValue="https://euthycare.com" />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Modo de lançamento</label>
            <div className="flex items-center gap-3">
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-sage-500 transition-colors focus:outline-none">
                <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white shadow transition-transform" />
              </button>
              <span className="text-sm text-gray-600">Activo — redireciona para página de espera</span>
            </div>
          </div>
          <SaveButton saved={saved} onClick={handleSave} />
        </Card>
      )}

      {tab === 'terapeuta' && (
        <Card className="space-y-5 max-w-2xl">
          <h2 className="font-semibold text-gray-800">Perfil da terapeuta</h2>
          <Field label="Nome completo" defaultValue="Dra. Ana Silva" />
          <Field label="Especialidade" defaultValue="Psicologia Clínica · Terapia Cognitivo-Comportamental" />
          <Field label="Número de cédula" defaultValue="12345" />
          <Field label="Bio curta" defaultValue="Psicóloga especializada em ansiedade, burnout e bem-estar emocional." textarea />
          <Field label="Anos de experiência" defaultValue="8" type="number" />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Duração da sessão (min)</label>
            <select className="h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400">
              <option>50</option>
              <option>60</option>
              <option>90</option>
            </select>
          </div>
          <SaveButton saved={saved} onClick={handleSave} />
        </Card>
      )}

      {tab === 'pagamentos' && (
        <Card className="space-y-5 max-w-2xl">
          <h2 className="font-semibold text-gray-800">Preços e Stripe</h2>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            Alterar os preços aqui actualiza apenas os valores exibidos. Para alterar os preços do Stripe, aceda ao painel Stripe e actualize os Price IDs.
          </div>
          <Field label="Preço consulta experimental (€)" defaultValue="25" type="number" />
          <Field label="Preço pacote Início (€)" defaultValue="120" type="number" />
          <Field label="Preço pacote Evolução (€)" defaultValue="220" type="number" />
          <Field label="Preço pacote Transformação (€)" defaultValue="340" type="number" />
          <hr className="border-cream-300" />
          <Field label="Stripe Public Key" defaultValue="pk_live_..." />
          <Field label="Stripe Webhook Secret" defaultValue="whsec_..." type="password" />
          <SaveButton saved={saved} onClick={handleSave} />
        </Card>
      )}

      {tab === 'notificacoes' && (
        <Card className="space-y-5 max-w-2xl">
          <h2 className="font-semibold text-gray-800">Notificações por email</h2>
          {[
            { label: 'Novo agendamento', desc: 'Receber email quando alguém agenda uma consulta', active: true },
            { label: 'Novo inscrito na lista de espera', desc: 'Notificação de novo interesse na plataforma', active: true },
            { label: 'Pagamento recebido', desc: 'Confirmação de compra de pacote', active: true },
            { label: 'Agendamento cancelado', desc: 'Quando um cliente cancela uma consulta', active: false },
            { label: 'Relatório semanal', desc: 'Resumo de actividade enviado às segundas-feiras', active: false },
          ].map(n => (
            <div key={n.label} className="flex items-start gap-4">
              <button className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none mt-0.5 ${n.active ? 'bg-sage-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${n.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-800">{n.label}</p>
                <p className="text-xs text-gray-400">{n.desc}</p>
              </div>
            </div>
          ))}
          <SaveButton saved={saved} onClick={handleSave} />
        </Card>
      )}
    </div>
  )
}

function Field({ label, defaultValue, type = 'text', textarea = false }: {
  label: string
  defaultValue: string
  type?: string
  textarea?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {textarea ? (
        <textarea
          defaultValue={defaultValue}
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none"
        />
      ) : (
        <input
          type={type}
          defaultValue={defaultValue}
          className="w-full h-10 px-3 rounded-xl border border-cream-400 bg-cream-100 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
        />
      )}
    </div>
  )
}

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <div className="pt-2">
      <Button size="sm" onClick={onClick} className="gap-2">
        {saved ? <><Check className="h-4 w-4" /> Guardado</> : 'Guardar alterações'}
      </Button>
    </div>
  )
}
