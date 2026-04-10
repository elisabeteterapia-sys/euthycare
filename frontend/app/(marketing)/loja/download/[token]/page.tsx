'use client'

import { Download, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { use } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export default function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const downloadUrl = `${API}/loja/download/${token}`

  return (
    <section className="page-section min-h-[70vh] flex items-center">
      <div className="container-app w-full max-w-md mx-auto">
        <div className="bg-white rounded-3xl border border-sage-200 p-10 shadow-sm text-center">
          {/* Icon */}
          <div className="h-16 w-16 rounded-full bg-sage-100 flex items-center justify-center mx-auto mb-6">
            <Download className="h-8 w-8 text-sage-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">O seu download</h1>
          <p className="text-gray-500 text-sm mb-8">
            Clique no botão abaixo para transferir o seu ficheiro PDF.
          </p>

          <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="w-full gap-2 mb-5">
              <Download className="h-5 w-5" />
              Transferir PDF
            </Button>
          </a>

          {/* Info */}
          <div className="space-y-2 text-left bg-cream-100 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
              <span>Este link tem um prazo de validade de <strong>7 dias</strong> a partir da compra.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-sage-500" />
              <span>Pode fazer download até <strong>10 vezes</strong>. Guarde o ficheiro localmente.</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-4">
            Problemas com o download?{' '}
            <Link href="/contato" className="text-sage-600 hover:underline">Contacte-nos</Link>
          </p>

          <Link href="/loja" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Ver mais produtos
          </Link>
        </div>
      </div>
    </section>
  )
}
