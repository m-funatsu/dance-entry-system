import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Modeを無効化（DOM操作エラーを回避）
  reactStrictMode: false,
  // セキュリティヘッダーの設定
  async headers() {
    return [
      {
        // すべてのルートに適用
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ]
  },
  // 画像の最適化設定
  images: {
    domains: [
      'localhost',
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('/')[0] || ''
    ].filter(Boolean)
  },
  // 実験的機能
  experimental: {}
};

export default nextConfig;
