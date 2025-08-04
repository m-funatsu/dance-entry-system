import { NextResponse } from 'next/server'

// セキュリティヘッダーの設定
export function setSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "media-src 'self' https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ]

  // 本番環境でのみ厳格なCSPを適用
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      cspDirectives.join('; ')
    )
  }

  // Strict Transport Security
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // X-XSS-Protection (レガシーブラウザ用)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // X-DNS-Prefetch-Control
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  // X-Download-Options
  response.headers.set('X-Download-Options', 'noopen')

  // X-Permitted-Cross-Domain-Policies
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  return response
}

// APIレスポンス用のセキュリティヘッダー
export function setAPISecurityHeaders(headers: Headers): void {
  // CORS関連ヘッダー（必要に応じて調整）
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://localhost:3000']
  const origin = headers.get('origin')
  
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
  headers.set('Access-Control-Max-Age', '86400')
  headers.set('Access-Control-Allow-Credentials', 'true')

  // その他のセキュリティヘッダー
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
}

// ファイルダウンロード用のセキュリティヘッダー
export function setFileDownloadHeaders(
  headers: Headers,
  filename: string,
  contentType: string
): void {
  // Content-Disposition
  headers.set(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(filename)}"`
  )
  
  // Content-Type
  headers.set('Content-Type', contentType)
  
  // セキュリティヘッダー
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Download-Options', 'noopen')
  headers.set('Cache-Control', 'private, no-cache')
}