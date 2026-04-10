'use client'

import { useState } from 'react'
import { Save, Clock, User, Bell, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Tab = 'perfil' | 'horarios' | 'notificacoes' | 'seguranca'

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>('perfil')
  const [saved, setSaved] = useState(false)

  // Estado perfil
  const [nome, setNome]   = useState('Dra. Ana Lima')
  const [email, setEmail] = useState('ana@consultorio.com')
  const [bio, setBio]     = useState('')

  // Estado horários
  const [horarios, setHorarios] = useState(
    DIAS.map((dia, i) => ({
      dia,
      ativo:      i < 5,
      inicio:     '09:00',
      fim:        '18:00',
      intervalo:  60,
    }))
  )

  function salvar() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'perfil',        label: 'Perfil',         icon: User  },
    { key: 'horarios',      label: 'Horários',        icon: Clock },
    { key: 'notificacoes',  label: 'Notificações',    icon: Bell  },
    { key: 'seguranca',     label: 'Segurança',       icon: Shield},
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-400 mt-1">Gerencie o seu perfil e preferências</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-100 border border-cream-300 rounded-2xl p-1 w-fit flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              tab === key ? 'bg-sage-400 text-white shadow-soft' : 'text-gray-500 hover:text-gray-800'
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Perfil ─────────────────────────────────────────────── */}
      {tab === 'perfil' && (
        <Card className="space-y-5">
          <h2 className="font-semibold text-gray-800">Dados pessoais</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Nome completo" value={nome} onChange={e => setNome(e.target.value)} />
            <Input label="E-mail" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Bio / Apresentação</label>
            <textarea
              rows={4}
              placeholder="Breve apresentação para os seus pacientes…"
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full rounded-xl border border-cream-400 bg-cream-100 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none"
            />
          </div>
          <Button onClick={salvar} className="gap-2">
            <Save className="h-4 w-4" />
            {saved ? 'Guardado!' : 'Guardar alterações'}
          </Button>
        </Card>
      )}

      {/* ── Horários ───────────────────────────────────────────── */}
      {tab === 'horarios' && (
        <Card className="space-y-5">
          <h2 className="font-semibold text-gray-800">Disponibilidade semanal</h2>
          <p className="text-sm text-gray-400">Define os teus horários de trabalho. Os clientes só podem agendar nos horários activos.</p>

          <div className="space-y-3">
            {horarios.map((h, i) => (
              <div key={h.dia} className={cn(
                'flex flex-wrap items-center gap-3 p-3 rounded-xl border transition-all',
                h.ativo ? 'border-sage-200 bg-sage-50/50' : 'border-cream-300 bg-cream-200/40 opacity-60'
              )}>
                <label className="flex items-center gap-2 w-28 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={h.ativo}
                    onChange={e => setHorarios(hs => hs.map((x, j) => j === i ? { ...x, ativo: e.target.checked } : x))}
                    className="rounded accent-sage-400"
                  />
                  <span className="text-sm font-medium text-gray-700">{h.dia}</span>
                </label>

                {h.ativo && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Das</span>
                      <input
                        type="time"
                        value={h.inicio}
                        onChange={e => setHorarios(hs => hs.map((x, j) => j === i ? { ...x, inicio: e.target.value } : x))}
                        className="h-8 rounded-lg border border-cream-400 bg-cream-100 px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">às</span>
                      <input
                        type="time"
                        value={h.fim}
                        onChange={e => setHorarios(hs => hs.map((x, j) => j === i ? { ...x, fim: e.target.value } : x))}
                        className="h-8 rounded-lg border border-cream-400 bg-cream-100 px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Duração</span>
                      <select
                        value={h.intervalo}
                        onChange={e => setHorarios(hs => hs.map((x, j) => j === i ? { ...x, intervalo: Number(e.target.value) } : x))}
                        className="h-8 rounded-lg border border-cream-400 bg-cream-100 px-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400"
                      >
                        <option value={30}>30 min</option>
                        <option value={50}>50 min</option>
                        <option value={60}>60 min</option>
                        <option value={75}>75 min</option>
                        <option value={90}>90 min</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <Button onClick={salvar} className="gap-2">
            <Save className="h-4 w-4" />
            {saved ? 'Guardado!' : 'Guardar horários'}
          </Button>
        </Card>
      )}

      {/* ── Notificações ───────────────────────────────────────── */}
      {tab === 'notificacoes' && (
        <Card className="space-y-5">
          <h2 className="font-semibold text-gray-800">Preferências de notificação</h2>
          {[
            { label: 'Novo agendamento',          desc: 'Quando um paciente agenda uma consulta' },
            { label: 'Lembrete de sessão',         desc: '24 h antes de cada consulta' },
            { label: 'Cancelamento de consulta',   desc: 'Quando um paciente cancela' },
            { label: 'Novo pagamento recebido',    desc: 'Ao confirmar pagamento de pacote' },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between py-2 border-b border-cream-300 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{n.label}</p>
                <p className="text-xs text-gray-400">{n.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-6 bg-cream-400 peer-focus:ring-2 peer-focus:ring-sage-400 rounded-full peer peer-checked:bg-sage-400 transition-colors" />
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4" />
              </label>
            </div>
          ))}
          <Button onClick={salvar} className="gap-2">
            <Save className="h-4 w-4" />
            {saved ? 'Guardado!' : 'Guardar preferências'}
          </Button>
        </Card>
      )}

      {/* ── Segurança ──────────────────────────────────────────── */}
      {tab === 'seguranca' && (
        <Card className="space-y-5">
          <h2 className="font-semibold text-gray-800">Alterar palavra-passe</h2>
          <div className="space-y-4">
            <Input label="Palavra-passe atual"  type="password" placeholder="••••••••" />
            <Input label="Nova palavra-passe"   type="password" placeholder="••••••••" />
            <Input label="Confirmar nova"        type="password" placeholder="••••••••" />
          </div>
          <Button onClick={salvar} className="gap-2">
            <Shield className="h-4 w-4" />
            {saved ? 'Palavra-passe alterada!' : 'Atualizar palavra-passe'}
          </Button>
        </Card>
      )}
    </div>
  )
}
