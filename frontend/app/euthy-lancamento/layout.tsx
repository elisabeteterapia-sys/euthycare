import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Euthy está chegando — Lista de Espera',
  description:
    'Seja um dos primeiros terapeutas a testar o Euthy. Gerencie pacientes, agenda e consultas numa plataforma pensada para quem cuida.',
}

export default function LancamentoLayout({ children }: { children: React.ReactNode }) {
  return children
}
