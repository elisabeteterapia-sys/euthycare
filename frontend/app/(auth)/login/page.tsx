'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { signIn } from '@/lib/auth'
import type { Metadata } from 'next'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Credenciais inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Bem-vindo de volta</h1>
      <p className="text-gray-400 text-sm mb-8">Entre na sua conta Euthycare.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex justify-end">
          <Link href="/recuperar-senha" className="text-xs text-sage-600 hover:underline">
            Esqueceu a senha?
          </Link>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Não tem conta?{' '}
        <Link href="/cadastro" className="text-sage-600 font-medium hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </div>
  )
}
