'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home', exact: true },
  { href: '/agendamento', label: 'Consultas' },
  { href: '/loja', label: 'Loja' },
  { href: '/blog', label: 'Blog' },
  { href: '/contato', label: 'Contato' },
  { href: '/euthy-lancamento', label: 'Lista de espera' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur-md border-b border-cream-300">
      <div className="container-app flex h-16 items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-sage-700 text-lg flex-shrink-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center">
            <Leaf className="h-4 w-4 text-white" />
          </div>
          <span>Euthy<span className="text-sage-400">care</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive(link.href, link.exact)
                  ? 'text-sage-700 bg-sage-50 font-semibold'
                  : 'text-gray-600 hover:text-sage-600 hover:bg-sage-50'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
          <Link href="/login">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link href="/agendamento">
            <Button size="sm">Agendar consulta</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-cream-300 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        'lg:hidden border-t border-cream-300 bg-cream-100 overflow-hidden transition-all duration-300',
        open ? 'max-h-screen' : 'max-h-0'
      )}>
        <nav className="container-app py-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive(link.href, link.exact)
                  ? 'bg-sage-50 text-sage-700 font-semibold'
                  : 'text-gray-700 hover:bg-cream-300'
              )}
            >
              {link.label}
            </Link>
          ))}

          <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-cream-300">
            <Link href="/agendamento" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full">Agendar consulta</Button>
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full">Entrar na conta</Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
