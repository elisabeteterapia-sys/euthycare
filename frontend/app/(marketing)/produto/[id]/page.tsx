import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProdutoDetail from './produto-detail'

interface Produto {
  id: string
  nome: string
  descricao: string
  conteudo: string
  preco_cents: number
  capa_url: string | null
  tipo: string
}

async function getProduto(id: string): Promise<Produto | null> {
  const API = process.env.BACKEND_URL ?? 'http://localhost:3001'
  try {
    const res = await fetch(`${API}/loja/produto/${id}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.produto ?? null
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const produto = await getProduto(id)
  if (!produto) return { title: 'Produto não encontrado — EuthyCare' }
  return {
    title: `${produto.nome} — EuthyCare Loja`,
    description: produto.descricao,
    openGraph: {
      images: produto.capa_url ? [produto.capa_url] : [],
    },
  }
}

export default async function ProdutoPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const produto = await getProduto(id)
  if (!produto) notFound()

  return <ProdutoDetail produto={produto} />
}
