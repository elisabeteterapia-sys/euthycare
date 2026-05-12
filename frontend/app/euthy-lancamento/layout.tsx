import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EuthyApp — Plataforma de Gestão Clínica para Terapeutas',
  description:
    'Gerencie pacientes, consultas, registos clínicos e financeiro numa plataforma pensada para terapeutas portugueses. Acesso imediato após pagamento.',
}

export default function LancamentoLayout({ children }: { children: React.ReactNode }) {
  return children
}
