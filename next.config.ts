import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Image optimization config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Redirect www to non-www
  async redirects() {
    return []
  },
}

export default nextConfig
