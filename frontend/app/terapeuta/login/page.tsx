'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function TerapeutaLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const r = await fetch(`${API}/terapeutas/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
      const json = await r.json()
      if (!r.ok) { setErro(json.error ?? 'Credenciais inválidas'); return }

      sessionStorage.setItem('terapeuta_token', json.token)
      sessionStorage.setItem('terapeuta_info', JSON.stringify(json.terapeuta))
      router.push('/terapeuta/agenda')
    } catch {
      setErro('Erro de ligação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-card p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-sage-400 flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">E</span>
          </div>
          <h1 className="text-2xl font-bold text-sage-800">Portal Terapeuta</h1>
          <p className="text-sm text-sage-500 mt-1">EuthyCare</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-sage-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 bg-cream-50"
              placeholder="terapeuta@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1">Senha</label>
            <div className="relative">
              <input
                type={verSenha ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="w-full border border-sage-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400 bg-cream-50"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setVerSenha(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 transition-colors"
                tabIndex={-1}
              >
                {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage-400 hover:bg-sage-500 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-3 transition-colors"
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-sage-400 mt-6">
          Problemas com o acesso? Contacte a administração.
        </p>
      </div>
    </div>
  )
}
