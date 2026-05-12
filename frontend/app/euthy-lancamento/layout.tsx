import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EuthyApp — A Gestão Clínica nas Tuas Mãos',
  description:
    'Agenda, pacientes, cobranças e IA de apoio clínico — tudo automatizado. Chega de ligar a cobrar ou a confirmar consultas. Começa hoje, acesso imediato.',
}

export default function LancamentoLayout({ children }: { children: React.ReactNode }) {
  return children
}
