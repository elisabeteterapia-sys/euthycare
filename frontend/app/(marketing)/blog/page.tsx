import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Blog' }

const featured = {
  slug: 'tcc-ansiedade-guia-pratico',
  title: 'TCC para ansiedade: guia prático para terapeutas',
  excerpt: 'Um panorama das principais técnicas cognitivo-comportamentais e como aplicá-las de forma eficaz no contexto clínico.',
  category: 'TCC',
  readTime: '8 min',
  date: '5 de abril, 2026',
  author: 'Equipe Euthycare',
}

const posts = [
  { slug: 'mindfulness-sessoes', title: 'Como integrar mindfulness nas sessões clínicas', category: 'Mindfulness', readTime: '5 min', date: '1 abr 2026' },
  { slug: 'prontuario-digital-lgpd', title: 'Prontuários digitais e LGPD: o que você precisa saber', category: 'Jurídico', readTime: '6 min', date: '28 mar 2026' },
  { slug: 'criancas-emocoes', title: 'Trabalhando regulação emocional com crianças', category: 'Infância', readTime: '7 min', date: '22 mar 2026' },
  { slug: 'renda-extra-terapeutas', title: 'Como gerar renda extra vendendo recursos digitais', category: 'Carreira', readTime: '4 min', date: '15 mar 2026' },
  { slug: 'gestao-consultorio', title: '5 erros de gestão que afetam terapeutas independentes', category: 'Gestão', readTime: '5 min', date: '10 mar 2026' },
  { slug: 'trauma-abordagens', title: 'Abordagens contemporâneas no tratamento do trauma', category: 'Clínica', readTime: '9 min', date: '3 mar 2026' },
]

const categoryVariants: Record<string, 'sage' | 'lilac' | 'cream' | 'amber'> = {
  TCC: 'sage', Mindfulness: 'lilac', Jurídico: 'cream',
  Infância: 'lilac', Carreira: 'amber', Gestão: 'cream', Clínica: 'sage',
}

export default function BlogPage() {
  return (
    <>
      <section className="py-16 bg-cream-100 text-center">
        <div className="container-app">
          <Badge variant="sage" className="mb-4">Conhecimento clínico</Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Blog Euthycare</h1>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            Artigos, técnicas e recursos para enriquecer sua prática clínica.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-app">
          {/* Featured */}
          <Link href={`/blog/${featured.slug}`}>
            <Card hover className="mb-8 md:flex gap-0 overflow-hidden p-0">
              <div className="md:w-2/5 bg-gradient-to-br from-sage-300 to-lilac-300 min-h-52 md:min-h-auto rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none" />
              <CardContent className="p-6 md:p-8 flex flex-col justify-center">
                <Badge variant={categoryVariants[featured.category] ?? 'sage'} className="mb-3 self-start">
                  {featured.category}
                </Badge>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">{featured.title}</h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{featured.excerpt}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-5">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{featured.readTime}</span>
                  <span>{featured.date}</span>
                  <span>{featured.author}</span>
                </div>
                <Button size="sm" variant="outline" className="self-start gap-1">
                  Ler artigo <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card hover className="h-full flex flex-col">
                  <div className="rounded-xl bg-gradient-to-br from-cream-300 to-lilac-100 h-28 mb-4" />
                  <Badge
                    variant={categoryVariants[post.category] ?? 'cream'}
                    className="mb-2 self-start"
                  >
                    {post.category}
                  </Badge>
                  <h3 className="font-semibold text-gray-800 leading-snug mb-3 flex-1">{post.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                    <span>{post.date}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
