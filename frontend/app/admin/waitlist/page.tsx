import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Lista de espera · Admin' }

const inscritos = [
  { id: '1', nome: 'João Ferreira',  email: 'joao@terapia.pt',   tipo: 'terapeuta', data: '10 Abr 2026', contatado: false },
  { id: '2', nome: 'Sara Mendes',    email: 'sara@clinica.pt',    tipo: 'clinica',   data: '9 Abr 2026',  contatado: false },
  { id: '3', nome: 'Rui Alves',      email: 'rui@email.com',      tipo: 'terapeuta', data: '8 Abr 2026',  contatado: true  },
  { id: '4', nome: 'Patrícia Costa', email: 'pat@psico.pt',       tipo: 'terapeuta', data: '7 Abr 2026',  contatado: true  },
  { id: '5', nome: 'Marcos Lima',    email: 'marcos@email.com',   tipo: 'clinica',   data: '5 Abr 2026',  contatado: false },
]

export default function WaitlistPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista de espera</h1>
          <p className="text-sm text-gray-400 mt-1">{inscritos.length} inscritos · {inscritos.filter(i => !i.contatado).length} por contactar</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total inscritos', value: inscritos.length },
          { label: 'Terapeutas',      value: inscritos.filter(i => i.tipo === 'terapeuta').length },
          { label: 'Clínicas',        value: inscritos.filter(i => i.tipo === 'clinica').length },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300 bg-cream-200/50">
              {['Nome', 'E-mail', 'Perfil', 'Data', 'Estado'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-300">
            {inscritos.map(i => (
              <tr key={i.id} className="hover:bg-cream-200/40 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-800">{i.nome}</td>
                <td className="px-5 py-3.5">
                  <a href={`mailto:${i.email}`} className="text-sage-600 hover:underline flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {i.email}
                  </a>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant={i.tipo === 'clinica' ? 'lilac' : 'sage'} className="capitalize">{i.tipo}</Badge>
                </td>
                <td className="px-5 py-3.5 text-gray-500">{i.data}</td>
                <td className="px-5 py-3.5">
                  <Badge variant={i.contatado ? 'sage' : 'amber'}>{i.contatado ? 'Contatado' : 'Pendente'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
