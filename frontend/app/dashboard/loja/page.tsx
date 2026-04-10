import type { Metadata } from 'next'
import { ShoppingBag, ArrowRight, ExternalLink } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Loja' }

const produtos = [
  { id: '1', nome: 'Guia de Regulação Emocional', vendas: 12, preco: '9.90€', status: 'ativo' },
  { id: '2', nome: 'Planner Terapêutico 2026',    vendas: 8,  preco: '14.90€', status: 'ativo' },
  { id: '3', nome: 'Kit Mindfulness em PDF',       vendas: 3,  preco: '7.50€',  status: 'rascunho' },
]

export default function LojaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loja</h1>
          <p className="text-sm text-gray-400 mt-1">Recursos digitais à venda</p>
        </div>
        <div className="flex gap-2">
          <Link href="/loja" target="_blank">
            <Button variant="outline" size="sm" className="gap-1">
              <ExternalLink className="h-4 w-4" /> Ver loja pública
            </Button>
          </Link>
          <Button size="sm" className="gap-1">
            <ShoppingBag className="h-4 w-4" /> Novo produto
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Receita este mês', value: '€237', sub: '+18% vs anterior' },
          { label: 'Produtos ativos',  value: '2',    sub: '1 em rascunho' },
          { label: 'Vendas este mês',  value: '23',   sub: 'downloads' },
        ].map(s => (
          <Card key={s.label}>
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-sage-500 mt-1">{s.sub}</p>
          </Card>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-300 bg-cream-200/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Produto</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Preço</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Vendas</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-300">
            {produtos.map(p => (
              <tr key={p.id} className="hover:bg-cream-200/40 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-800">{p.nome}</td>
                <td className="px-5 py-3.5 text-gray-600">{p.preco}</td>
                <td className="px-5 py-3.5 text-gray-600">{p.vendas}</td>
                <td className="px-5 py-3.5">
                  <Badge variant={p.status === 'ativo' ? 'sage' : 'cream'} className="capitalize">{p.status}</Badge>
                </td>
                <td className="px-5 py-3.5">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Editar <ArrowRight className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
