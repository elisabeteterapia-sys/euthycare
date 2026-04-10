import Link from 'next/link'
import { XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-cream-200 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento cancelado</h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          O pagamento foi cancelado e nenhum valor foi cobrado.
          <br />Você pode tentar novamente quando quiser.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/venda">
            <Button className="w-full" size="lg">Ver planos novamente</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
