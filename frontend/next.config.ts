import type { NextConfig } from 'next'

const config: NextConfig = {
  // Gera bundle standalone para deploy em VPS (não precisa de node_modules completos)
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default config
