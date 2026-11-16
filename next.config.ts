import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,

  async redirects() {
    return [{ source: '/faq', destination: '/help', permanent: true }]
  },
}

export default nextConfig
