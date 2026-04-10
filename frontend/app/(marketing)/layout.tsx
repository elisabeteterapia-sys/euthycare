import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CookieBanner } from '@/components/layout/cookie-banner'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </div>
  )
}
