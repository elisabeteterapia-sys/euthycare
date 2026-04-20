'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
  criado_em: string
}

const categoryVariants: Record<string, 'sage' | 'lilac' | 'cream' | 'amber'> = {
  TCC: 'sage', Mindfulness: 'lilac', Jurídico: 'cream',
  Infância: 'lilac', Carreira: 'amber', Gestão: 'cream',
  Clínica: 'sage', Saúde: 'sage', Terapia: 'lilac',
  'Bem-estar': 'amber', Relações: 'lilac', Ansiedade: 'cream',
}

export default function BlogPage() {
  const [posts, setPosts]   = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/blog`)
      .then(r => r.json())
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [])

  const featured = posts[0]
  const resto    = posts.slice(1)

  return (
    <>
      <section className="py-16 bg-cream-100 text-center">
        <div className="container-app">
          <Badge variant="sage" className="mb-4">Bem-estar emocional</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Blog EuthyCare</h1>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            Artigos sobre ansiedade, burnout, trauma e saúde emocional — para quem quer cuidar de si.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-app">
          {loading && (
            <div className="flex justify-center py-20 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> A carregar…
            </div>
          )}

          {!loading && posts.length === 0 && (
            <p className="text-center text-gray-400 py-20">Ainda não há artigos publicados.</p>
          )}

          {!loading && featured && (
            <Link href={`/blog/${featured.slug}`}>
              <Card hover className="mb-8 md:flex gap-0 overflow-hidden p-0">
                <div className="md:w-2/5 bg-gradient-to-br from-sage-300 to-lilac-300 min-h-52 md:min-h-auto rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none" />
                <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                  <Badge variant={categoryVariants[featured.categoria] ?? 'sage'} className="mb-3 self-start">
                    {featured.categoria}
                  </Badge>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">{featured.titulo}</h2>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{featured.resumo}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-5">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{featured.tempo_leitura}</span>
                    <span>{new Date(featured.criado_em).toLocaleDateString('pt-PT')}</span>
                    {featured.autor && <span>{featured.autor}</span>}
                  </div>
                  <Button size="sm" variant="outline" className="self-start gap-1">
                    Ler artigo <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          )}

          {!loading && resto.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resto.map(post => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <Card hover className="h-full flex flex-col">
                    <div className="rounded-xl bg-gradient-to-br from-cream-300 to-lilac-100 h-28 mb-4" />
                    <Badge variant={categoryVariants[post.categoria] ?? 'cream'} className="mb-2 self-start">
                      {post.categoria}
                    </Badge>
                    <h3 className="font-semibold text-gray-800 leading-snug mb-3 flex-1">{post.titulo}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.tempo_leitura}</span>
                      <span>{new Date(post.criado_em).toLocaleDateString('pt-PT')}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
