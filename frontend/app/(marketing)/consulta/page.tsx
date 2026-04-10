'use client'

import { useState } from 'react'
import {
  CalendarDays, Clock, Video, MapPin, CheckCircle2,
  ArrowRight, Shield, CreditCard, Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ── Config da terapeuta ──────────────────────────────────────────
const TERAPEUTA = {
  nome: 'Dra. Ana Ribeiro',
  especialidade: 'Psicoterapeuta • TCC & ACT',
  bio: 'Especialista em ansiedade, depressão e desenvolvimento pessoal com 12 anos de experiência clínica.',
  preco: 80,
  duracao: 50,
}

// Horários disponíveis por padrão (os bloqueados são filtrados dinamicamente)
const HORARIOS_POSSIVEIS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00']

// Horários já ocupados — em produção, viria de uma API
const HORARIOS_OCUPADOS: Record<string, string[]> = {
  // Exemplo: '2026-4-10': ['09:00', '14:00']
}

const MODALIDADES = [
  { id: 'online', label: 'Online', icon: Video, desc: 'Videochamada segura' },
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

type Step = 1 | 2 | 3 | 4

export default function ConsultaPage() {
  const today = new Date()
  const [step, setStep] = useState<Step>(1)
  const [modalidade, setModalidade] = useState('')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [dia, setDia] = useState<number | null>(null)
  const [horario, setHorario] = useState('')
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', notas: '' })
  const [pagamentoOk, setPagamentoOk] = useState(false)

  const { firstDay, daysInMonth } = getCalendarDays(year, month)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setDia(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setDia(null)
  }

  function isPast(day: number) {
    const d = new Date(year, month, day)
    const t = new Date(); t.setHours(0, 0, 0, 0)
    return d < t
  }
  function isWeekend(day: number) {
    const dow = new Date(year, month, day).getDay()
    return dow === 0 || dow === 6
  }

  function getHorariosDisponiveis() {
    if (!dia) return HORARIOS_POSSIVEIS
    const key = `${year}-${month + 1}-${dia}`
    const ocupados = HORARIOS_OCUPADOS[key] ?? []
    return HORARIOS_POSSIVEIS.filter(h => !ocupados.includes(h))
  }

  // Step 4 — simula pagamento e envia confirmação
  function handlePagamento(e: React.FormEvent) {
    e.preventDefault()
    // Em produção: criar Stripe Checkout Session via API, redirecionar
    // Aqui simulamos o sucesso
    setPagamentoOk(true)
  }

  const dataFormatada = dia ? `${dia < 10 ? '0' : ''}${dia}/${month + 1 < 10 ? '0' : ''}${month + 1}/${year}` : ''

  if (pagamentoOk) {
    return (
      <div className="min-h-screen bg-cream-200 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-sage-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-sage-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Consulta confirmada!</h1>
          <p className="text-gray-500 mb-2">
            Pagamento recebido. Enviámos um e-mail de confirmação para <strong>{form.email}</strong>.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Receberá um lembrete 24h antes da consulta.
          </p>
          <div className="rounded-2xl bg-cream-100 border border-cream-300 p-5 text-left text-sm space-y-2 mb-6">
            <div className="flex justify-between"><span className="text-gray-400">Terapeuta</span><span className="font-medium">{TERAPEUTA.nome}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Data</span><span className="font-medium">{dataFormatada} às {horario}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Modalidade</span><span className="font-medium capitalize">{modalidade}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Duração</span><span className="font-medium">{TERAPEUTA.duracao} minutos</span></div>
            <div className="flex justify-between border-t border-cream-300 pt-2 mt-2">
              <span className="text-gray-400">Total pago</span>
              <span className="font-bold text-gray-800">€{TERAPEUTA.preco}</span>
            </div>
          </div>
          <Button className="w-full" onClick={() => { setPagamentoOk(false); setStep(1); setModalidade(''); setDia(null); setHorario(''); setForm({ nome: '', email: '', telefone: '', notas: '' }) }}>
            Fazer novo agendamento
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero */}
      <section className="py-16 bg-cream-100 text-center border-b border-cream-300">
        <div className="container-app">
          <Badge variant="sage" className="mb-4">Agendar consulta</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Consulta com {TERAPEUTA.nome}</h1>
          <p className="text-gray-500 max-w-md mx-auto">{TERAPEUTA.especialidade}</p>
          <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">{TERAPEUTA.bio}</p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5 bg-cream-200 rounded-xl px-3 py-1.5">
              <Clock className="h-4 w-4 text-sage-400" /> {TERAPEUTA.duracao} minutos
            </span>
            <span className="flex items-center gap-1.5 bg-cream-200 rounded-xl px-3 py-1.5">
              <CreditCard className="h-4 w-4 text-sage-400" /> €{TERAPEUTA.preco}
            </span>
            <span className="flex items-center gap-1.5 bg-cream-200 rounded-xl px-3 py-1.5">
              <Lock className="h-4 w-4 text-sage-400" /> Pagamento seguro
            </span>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-app max-w-3xl">

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-10">
            {([1, 2, 3, 4] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all',
                  step >= s ? 'bg-sage-400 text-white' : 'bg-cream-300 text-gray-400'
                )}>
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                <span className={cn('text-xs font-medium hidden sm:block', step >= s ? 'text-sage-600' : 'text-gray-400')}>
                  {['Modalidade', 'Data', 'Horário', 'Pagamento'][s - 1]}
                </span>
                {s < 4 && <div className={cn('flex-1 h-px', step > s ? 'bg-sage-400' : 'bg-cream-300')} />}
              </div>
            ))}
          </div>

          {/* Step 1: Modalidade */}
          {step === 1 && (
            <Card className="animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Como prefere a consulta?</h2>
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {MODALIDADES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModalidade(m.id)}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border text-left transition-all',
                      modalidade === m.id
                        ? 'border-sage-400 bg-sage-50 shadow-soft'
                        : 'border-cream-400 hover:border-sage-300'
                    )}
                  >
                    <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', modalidade === m.id ? 'bg-sage-400 text-white' : 'bg-cream-300 text-gray-500')}>
                      <m.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{m.label}</p>
                      <p className="text-xs text-gray-400">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Button className="w-full gap-2" disabled={!modalidade} onClick={() => setStep(2)}>
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </Card>
          )}

          {/* Step 2: Calendário */}
          {step === 2 && (
            <Card className="animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Escolha a data</h2>

              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-cream-300 text-gray-500">←</button>
                <span className="font-semibold text-gray-800">{MESES[month]} {year}</span>
                <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-cream-300 text-gray-500">→</button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {DIAS_SEMANA.map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 mb-8">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const past = isPast(d)
                  const weekend = isWeekend(d)
                  const disabled = past || weekend
                  // Check if day has any available slots
                  const key = `${year}-${month + 1}-${d}`
                  const ocupados = HORARIOS_OCUPADOS[key] ?? []
                  const semVagas = !disabled && ocupados.length >= HORARIOS_POSSIVEIS.length
                  return (
                    <button
                      key={d}
                      disabled={disabled || semVagas}
                      onClick={() => setDia(d)}
                      className={cn(
                        'h-10 w-full rounded-xl text-sm font-medium transition-all',
                        dia === d && 'bg-sage-400 text-white shadow-soft',
                        !disabled && !semVagas && dia !== d && 'hover:bg-cream-300 text-gray-700',
                        (disabled || semVagas) && 'text-gray-300 cursor-not-allowed',
                        semVagas && !disabled && 'line-through',
                      )}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                <Button className="flex-1 gap-2" disabled={!dia} onClick={() => setStep(3)}>
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 3: Horário */}
          {step === 3 && (
            <Card className="animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Escolha o horário</h2>
              <p className="text-sm text-gray-400 mb-6">{dataFormatada} · {TERAPEUTA.duracao} min</p>

              {getHorariosDisponiveis().length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Sem horários disponíveis neste dia.</p>
                  <p className="text-sm">Escolha outra data.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 mb-8">
                  {getHorariosDisponiveis().map((h) => (
                    <button
                      key={h}
                      onClick={() => setHorario(h)}
                      className={cn(
                        'py-3 rounded-xl text-sm font-semibold border transition-all',
                        horario === h
                          ? 'bg-sage-400 text-white border-sage-400 shadow-soft'
                          : 'border-cream-400 text-gray-700 hover:border-sage-300 hover:bg-sage-50'
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
                <Button className="flex-1 gap-2" disabled={!horario} onClick={() => setStep(4)}>
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 4: Dados + Pagamento */}
          {step === 4 && (
            <Card className="animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Confirmar e pagar</h2>

              {/* Resumo */}
              <div className="rounded-xl bg-sage-50 border border-sage-200 p-4 mb-6 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-gray-400">Terapeuta</span><br /><strong className="text-gray-700">{TERAPEUTA.nome}</strong></div>
                  <div><span className="text-gray-400">Modalidade</span><br /><strong className="text-gray-700 capitalize">{modalidade}</strong></div>
                  <div><span className="text-gray-400">Data</span><br /><strong className="text-gray-700">{dataFormatada}</strong></div>
                  <div><span className="text-gray-400">Horário</span><br /><strong className="text-gray-700">{horario}</strong></div>
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-sage-200">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="font-bold text-gray-900 text-base">€{TERAPEUTA.preco}</span>
                </div>
              </div>

              <form onSubmit={handlePagamento} className="space-y-4">
                <Input
                  label="Nome completo"
                  placeholder="Maria Silva"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  required
                />
                <Input
                  label="E-mail (para confirmação)"
                  type="email"
                  placeholder="maria@email.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
                <Input
                  label="Telefone (opcional)"
                  type="tel"
                  placeholder="9XXXXXXXX"
                  value={form.telefone}
                  onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Notas para a terapeuta (opcional)</label>
                  <textarea
                    rows={2}
                    placeholder="Algo que queira partilhar antes da sessão..."
                    value={form.notas}
                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                    className="w-full rounded-xl border border-cream-400 bg-cream-100 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sage-400 resize-none"
                  />
                </div>

                <div className="rounded-xl bg-cream-200 border border-cream-300 p-4 text-xs text-gray-500 flex items-start gap-2">
                  <Shield className="h-4 w-4 text-sage-400 flex-shrink-0 mt-0.5" />
                  <span>
                    O pagamento é processado de forma segura via Stripe. Aceitamos cartão de crédito/débito, MBWay e Multibanco.
                    Após o pagamento, a consulta fica confirmada e recebe um e-mail imediato.
                  </span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1">Voltar</Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={!form.nome || !form.email}
                  >
                    <Lock className="h-4 w-4" /> Pagar €{TERAPEUTA.preco}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </section>
    </>
  )
}
