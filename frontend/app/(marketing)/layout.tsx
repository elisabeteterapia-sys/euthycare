import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CookieBanner } from '@/components/layout/cookie-banner'
import { MarketingProviders } from '@/components/layout/marketing-providers'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingProviders>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
      </div>
    </MarketingProviders>
  )
}
