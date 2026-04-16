'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { signUp, signIn } from '@/lib/auth'

export default function CadastroPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.name)
      await signIn(form.email, form.password)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Criar conta</h1>
      <p className="text-gray-400 text-sm mb-8">Registe-se para agendar as suas consultas.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Nome completo" type="text" placeholder="O seu nome" value={form.name} onChange={set('name')} required />
        <Input label="E-mail" type="email" placeholder="o-seu@email.com" value={form.email} onChange={set('email')} required />
        <Input
          label="Senha"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={form.password}
          onChange={set('password')}
          hint="Mínimo de 8 caracteres"
          required
        />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
          Criar conta gratuita
        </Button>

        <p className="text-center text-xs text-gray-400 leading-relaxed">
          Ao criar sua conta, você concorda com nossos{' '}
          <Link href="/termos" className="underline">Termos de Uso</Link> e{' '}
          <Link href="/privacidade" className="underline">Política de Privacidade</Link>.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Já tem conta?{' '}
        <Link href="/login" className="text-sage-600 font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
