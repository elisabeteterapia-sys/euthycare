'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, CalendarDays, Users, ShoppingBag,
  FileText, Settings, LogOut, Leaf, ChevronRight, Mail, Type,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin/dashboard',     icon: LayoutDashboard, label: 'Visão geral' },
  { href: '/admin/agendamento',   icon: CalendarDays,    label: 'Agendamento' },
  { href: '/admin/utilizadores',  icon: Users,           label: 'Utilizadores' },
  { href: '/admin/waitlist',      icon: Mail,            label: 'Lista de espera' },
  { href: '/admin/loja',          icon: ShoppingBag,     label: 'Loja' },
  { href: '/admin/blog',          icon: FileText,        label: 'Blog' },
  { href: '/admin/conteudo',      icon: Type,            label: 'Conteúdo' },
  { href: '/admin/configuracoes', icon: Settings,        label: 'Configurações' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
          <button className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition-colors">
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
            <div className="h-8 w-8 rounded-full bg-sage-400 flex items-center justify-center text-white text-xs font-bold">A</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
