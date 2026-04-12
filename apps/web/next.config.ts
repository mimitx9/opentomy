import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@opentomy/ui', '@opentomy/crypto'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@opentomy/db'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
}

export default nextConfig
