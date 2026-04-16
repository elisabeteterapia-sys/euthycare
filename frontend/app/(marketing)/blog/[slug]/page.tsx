'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, User, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface Post {
  id: string
  slug: string
  titulo: string
  resumo: string
  categoria: string
  autor: string
  tempo_leitura: string
  conteudo: string
  criado_em: string
}

export default function BlogPostPage() {
  const { slug }              = useParams<{ slug: string }>()
  const [post, setPost]       = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`${API}/blog/${slug}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null } return r.json() })
      .then(d => { if (d) setPost(d) })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="flex justify-center items-center py-32 text-gray-400">
      <Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar…
    </div>
  )

  if (notFound || !post) return (
    <div className="container-app py-32 text-center">
      <p className="text-gray-500 mb-6">Artigo não encontrado.</p>
      <Link href="/blog">
        <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao blog</Button>
      </Link>
    </div>
  )

  const paragrafos = post.conteudo.split(/\n\n+/).filter(Boolean)

  return (
    <article className="py-16">
      <div className="container-app max-w-2xl">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-sage-600 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Voltar ao blog
        </Link>

        <Badge variant="sage" className="mb-4">{post.categoria}</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">{post.titulo}</h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-6">{post.resumo}</p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 pb-8 border-b border-cream-300 mb-8">
          <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{post.tempo_leitura}</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(post.criado_em).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {post.autor && <span className="flex items-center gap-1.5"><User className="h-4 w-4" />{post.autor}</span>}
        </div>

        <div className="space-y-4">
          {paragrafos.map((p, i) =>
            p.startsWith('## ')
              ? <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-2">{p.replace('## ', '')}</h2>
              : p.startsWith('# ')
              ? <h2 key={i} className="text-2xl font-bold text-gray-900 mt-8 mb-2">{p.replace('# ', '')}</h2>
              : <p key={i} className="text-gray-600 leading-relaxed">{p}</p>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-cream-300">
          <Link href="/blog">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Ver mais artigos
            </Button>
          </Link>
        </div>
      </div>
    </article>
  )
}
