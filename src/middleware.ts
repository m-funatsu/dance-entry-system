import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { setSecurityHeaders } from '@/lib/security-headers'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function middleware(request: NextRequest) {
  try {
    // セキュリティログ
    const ip = getClientIp(request)
    const pathname = request.nextUrl.pathname
    
    // 静的ファイルはスキップ
    if (pathname.startsWith('/_next') || pathname.includes('.')) {
      return NextResponse.next()
    }

    // レート制限チェック（ログインページ）
    if (pathname === '/auth/login' && request.method === 'POST') {
      const rateLimitResult = await checkRateLimit(ip, 'login')
      if (!rateLimitResult.success) {
        logger.warn('ログイン試行のレート制限', {
          action: 'login_rate_limit',
          metadata: { ip, remaining: rateLimitResult.remaining }
        })
        return new NextResponse(JSON.stringify({
          error: 'ログイン試行回数が制限を超えました。15分後に再試行してください。'
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString()
          }
        })
      }
    }

    // APIレート制限
    if (pathname.startsWith('/api/')) {
      const rateLimitResult = await checkRateLimit(ip, 'api')
      if (!rateLimitResult.success) {
        logger.warn('APIレート制限', {
          action: 'api_rate_limit',
          metadata: { ip, pathname, remaining: rateLimitResult.remaining }
        })
        return new NextResponse(JSON.stringify({
          error: 'API呼び出し回数が制限を超えました。'
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString()
          }
        })
      }
    }
    
    // Supabaseセッション管理
    const response = await updateSession(request)
    
    // セキュリティヘッダーの設定
    if (response instanceof NextResponse) {
      return setSecurityHeaders(response)
    }
    
    return response
  } catch (error) {
    logger.error('ミドルウェアエラー', error, {
      action: 'middleware_error',
      metadata: { url: request.url }
    })
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}