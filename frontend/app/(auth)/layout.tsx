import Link from 'next/link'
import { Leaf } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-200 flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-gradient-to-b from-sage-500 to-sage-700 p-12 text-white">
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
          <Leaf className="h-5 w-5" />
          Euthycare
        </Link>
        <div>
          <blockquote className="text-2xl font-light leading-relaxed mb-6">
            "A saúde mental é a fundação de tudo aquilo que somos e fazemos."
          </blockquote>
          <p className="text-sage-200 text-sm">Plataforma terapêutica para profissionais</p>
        </div>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 w-8 rounded-full bg-white/30" />
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex lg:hidden items-center gap-2 font-semibold text-sage-700 text-lg mb-8">
            <Leaf className="h-5 w-5 text-sage-400" />
            Euthycare
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
