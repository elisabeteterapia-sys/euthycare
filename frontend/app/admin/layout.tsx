'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, Users, ShoppingBag,
  FileText, Settings, LogOut, Leaf, ChevronRight, Mail, Type,
  Lock, Eye, EyeOff, UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ADMIN_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET ?? ''

const navItems = [
  { href: '/admin/dashboard',     icon: LayoutDashboard, label: 'Visão geral' },
  { href: '/admin/terapeutas',    icon: UserRound,       label: 'Terapeutas' },
  { href: '/admin/agendamento',   icon: CalendarDays,    label: 'Agendamento' },
  { href: '/admin/utilizadores',  icon: Users,           label: 'Utilizadores' },
  { href: '/admin/waitlist',      icon: Mail,            label: 'Lista de espera' },
  { href: '/admin/loja',          icon: ShoppingBag,     label: 'Loja' },
  { href: '/admin/blog',          icon: FileText,        label: 'Blog' },
  { href: '/admin/conteudo',      icon: Type,            label: 'Conteúdo' },
  { href: '/admin/configuracoes', icon: Settings,        label: 'Configurações' },
]

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  function submit(e: React.SyntheticEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)
    setTimeout(() => {
      if (password === ADMIN_SECRET && ADMIN_SECRET !== '') {
        sessionStorage.setItem('admin_auth', '1')
        onLogin()
      } else {
        setError(true)
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-cream-200 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gray-900 flex items-center justify-center mb-3">
            <Leaf className="h-6 w-6 text-sage-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Euthycare Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Introduza a password para continuar</p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-cream-300 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false) }}
                placeholder="••••••••"
                autoFocus
                className={cn(
                  'w-full h-11 px-3 pr-10 rounded-xl border text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sage-400 transition-colors',
                  error ? 'border-red-400 bg-red-50' : 'border-cream-400 bg-cream-100'
                )}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 mt-1.5">Password incorrecta. Tente novamente.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full h-11 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="h-4 w-4" />
            {loading ? 'A verificar…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          <Link href="/" className="hover:text-gray-600 transition-colors">← Voltar ao site</Link>
        </p>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const ok = sessionStorage.getItem('admin_auth') === '1'
    setAuthed(ok)
  }, [])

  function logout() {
    sessionStorage.removeItem('admin_auth')
    setAuthed(false)
  }

  // Still checking
  if (authed === null) return null

  // Not logged in
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  return (
    <div className="flex h-screen overflow-hidden bg-cream-200">
      {/* Sidebar */}
      <aside className="flex flex-col h-full w-60 bg-gray-900 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-gray-800">
          <div className="h-7 w-7 rounded-lg bg-sage-400 flex items-center justify-center flex-shrink-0">
            <Leaf className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">Euthycare</p>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-2">Menu</p>
          <ul className="flex flex-col gap-0.5">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
              return (
                <li key={href}>
                  <Link href={href} className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-sage-500 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}>
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="h-3 w-3 opacity-50" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 p-3">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors mb-1">
            <Leaf className="h-3.5 w-3.5" /> Ver site público
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-cream-100 border-b border-cream-300 flex items-center justify-between px-6 flex-shrink-0">
          <h1 className="text-sm font-semibold text-gray-700">
            {navItems.find(n => pathname.startsWith(n.href))?.label ?? 'Admin'}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
            <div className="h-8 w-8 rounded-full bg-sage-400 flex items-center justify-center text-white text-xs font-bold">A</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
