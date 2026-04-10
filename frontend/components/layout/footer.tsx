import Link from 'next/link'
import { Leaf } from 'lucide-react'

const links = {
  Plataforma: [
    { href: '/agendamento', label: 'Agendar consulta' },
    { href: '/loja', label: 'Loja de recursos' },
    { href: '/euthy-lancamento', label: 'App Euthy — Em breve' },
  ],
  Empresa: [
    { href: '/blog', label: 'Blog' },
    { href: '/contato', label: 'Contato' },
    { href: '/faq', label: 'FAQ' },
  ],
  Legal: [
    { href: '/privacidade', label: 'Privacidade' },
    { href: '/termos', label: 'Termos de uso' },
    { href: '/cookies', label: 'Política de cookies' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-cream-100 border-t border-cream-300 mt-auto">
      <div className="container-app py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold text-sage-700 text-lg mb-3">
              <Leaf className="h-5 w-5 text-sage-400" />
              Euthycare
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Plataforma de gestão terapêutica e bem-estar emocional. Feita para terapeutas e pacientes em todo o mundo.
            </p>
          </div>

          {/* Link groups */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">{group}</p>
              <ul className="flex flex-col gap-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-gray-600 hover:text-sage-600 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-cream-300 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Euthycare. Todos os direitos reservados.</p>
          <p className="text-xs text-gray-400">Feito com cuidado 🌿</p>
        </div>
      </div>
    </footer>
  )
}
