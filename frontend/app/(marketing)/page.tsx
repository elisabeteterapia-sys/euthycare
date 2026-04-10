// Homepage redireciona para a página de lançamento enquanto o app está em construção.
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EuthyCare — Em breve',
  description: 'Uma nova plataforma terapêutica está chegando. Junte-se à lista de espera e seja um dos primeiros.',
}

export default function HomePage() {
  redirect('/euthy-lancamento')
}
