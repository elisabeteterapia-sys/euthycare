'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, CalendarDays, ShoppingBag,
  Settings, LogOut, Leaf, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/pacientes', icon: Users, label: 'Pacientes' },
  { href: '/dashboard/agendamento', icon: CalendarDays, label: 'Agendamento' },
  { href: '/dashboard/loja', icon: ShoppingBag, label: 'Loja' },
  { href: '/dashboard/configuracoes', icon: Settings, label: 'Configurações' },
]

interface SidebarProps {
  userName?: string
  userEmail?: string
}

export function Sidebar({ userName = 'Terapeuta', userEmail = '' }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full w-64 bg-cream-100 border-r border-cream-300">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-cream-300 flex-shrink-0">
        <Leaf className="h-5 w-5 text-sage-400" />
        <span className="font-semibold text-sage-700 text-lg">Euthycare</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Menu</p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-sage-400 text-white shadow-soft'
                      : 'text-gray-600 hover:bg-cream-300 hover:text-sage-700'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="h-3 w-3 opacity-60" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User + logout */}
      <div className="border-t border-cream-300 p-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <Avatar name={userName} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
          </div>
        </div>
        <button className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}
