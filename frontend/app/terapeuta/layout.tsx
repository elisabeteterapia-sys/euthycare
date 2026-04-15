'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { TerapeutaCtx, type TerapeutaInfo } from './context'

export default function TerapeutaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [terapeuta, setTerapeuta] = useState<TerapeutaInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('terapeuta_token')
    const info = sessionStorage.getItem('terapeuta_info')
    if (!token || !info) {
      if (pathname !== '/terapeuta/login') router.push('/terapeuta/login')
      setLoading(false)
      return
    }
    try {
      setTerapeuta(JSON.parse(info))
    } catch {
      sessionStorage.removeItem('terapeuta_token')
      sessionStorage.removeItem('terapeuta_info')
      router.push('/terapeuta/login')
    }
    setLoading(false)
  }, [pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-200">
        <div className="text-sage-400 text-lg">A carregar...</div>
      </div>
    )
  }

  if (pathname === '/terapeuta/login') {
    return <>{children}</>
  }

  if (!terapeuta) return null

  function logout() {
    sessionStorage.removeItem('terapeuta_token')
    sessionStorage.removeItem('terapeuta_info')
    router.push('/terapeuta/login')
  }

  return (
    <TerapeutaCtx.Provider value={terapeuta}>
      <div className="min-h-screen bg-cream-200">
        {/* Top bar */}
        <header className="bg-white border-b border-sage-100 px-6 py-4 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sage-400 flex items-center justify-center text-white font-bold text-sm">
              {terapeuta.nome.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sage-800 text-sm">{terapeuta.nome}</p>
              <p className="text-xs text-sage-500">Portal da Terapeuta</p>
            </div>
          </div>

          <nav className="flex items-center gap-6">
            <a href="/terapeuta/agenda" className="text-sm font-medium text-sage-600 hover:text-sage-800 transition-colors">
              Agenda
            </a>
            <a href="/terapeuta/repasses" className="text-sm font-medium text-sage-600 hover:text-sage-800 transition-colors">
              Repasses
            </a>
            <a href="/terapeuta/calendario" className="text-sm font-medium text-sage-600 hover:text-sage-800 transition-colors">
              Calendário
            </a>
            <a href="/terapeuta/perfil" className="text-sm font-medium text-sage-600 hover:text-sage-800 transition-colors">
              Perfil
            </a>
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Sair
            </button>
          </nav>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </TerapeutaCtx.Provider>
  )
}
