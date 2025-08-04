import { LRUCache } from 'lru-cache'
import { logger } from '@/lib/logger'

// レート制限の設定
export interface RateLimitConfig {
  interval: number // ミリ秒
  uniqueTokenPerInterval: number // インターバルあたりの最大リクエスト数
}

// デフォルトのレート制限設定
export const RATE_LIMIT_CONFIGS = {
  // ログイン試行: 15分で5回まで
  login: {
    interval: 15 * 60 * 1000,
    uniqueTokenPerInterval: 5
  },
  // API呼び出し: 1分で30回まで
  api: {
    interval: 60 * 1000,
    uniqueTokenPerInterval: 30
  },
  // ファイルアップロード: 1時間で10回まで
  upload: {
    interval: 60 * 60 * 1000,
    uniqueTokenPerInterval: 10
  },
  // パスワードリセット: 1時間で3回まで
  passwordReset: {
    interval: 60 * 60 * 1000,
    uniqueTokenPerInterval: 3
  }
} as const

// レート制限の結果
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
}

// IPアドレスの取得
export function getClientIp(request: Request): string {
  // Cloudflare
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  // Vercel
  const xForwardedFor = request.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  // その他のプロキシ
  const xRealIp = request.headers.get('x-real-ip')
  if (xRealIp) return xRealIp

  // デフォルト
  return '127.0.0.1'
}

// レート制限のキー生成
function getRateLimitKey(identifier: string, type: keyof typeof RATE_LIMIT_CONFIGS): string {
  return `rate-limit:${type}:${identifier}`
}

// LRUキャッシュの作成
const rateLimiters = new Map<keyof typeof RATE_LIMIT_CONFIGS, LRUCache<string, number[]>>()

// レート制限チェック
export async function checkRateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMIT_CONFIGS
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIGS[type]
  
  // キャッシュの取得または作成
  let cache = rateLimiters.get(type)
  if (!cache) {
    cache = new LRUCache<string, number[]>({
      max: 500, // 最大500個のキーを保持
      ttl: config.interval
    })
    rateLimiters.set(type, cache)
  }

  const key = getRateLimitKey(identifier, type)
  const now = Date.now()
  const windowStart = now - config.interval

  // 現在のリクエスト履歴を取得
  let requests = cache.get(key) || []
  
  // 古いリクエストを削除
  requests = requests.filter(timestamp => timestamp > windowStart)

  // レート制限チェック
  if (requests.length >= config.uniqueTokenPerInterval) {
    const oldestRequest = Math.min(...requests)
    const reset = new Date(oldestRequest + config.interval)

    logger.warn('レート制限に達しました', {
      action: 'rate_limit_exceeded',
      metadata: {
        type,
        identifier,
        limit: config.uniqueTokenPerInterval,
        current: requests.length,
        reset: reset.toISOString()
      }
    })

    return {
      success: false,
      limit: config.uniqueTokenPerInterval,
      remaining: 0,
      reset
    }
  }

  // リクエストを記録
  requests.push(now)
  cache.set(key, requests)

  const remaining = config.uniqueTokenPerInterval - requests.length
  const reset = new Date(now + config.interval)

  return {
    success: true,
    limit: config.uniqueTokenPerInterval,
    remaining,
    reset
  }
}

// レート制限のリセット（テスト用）
export function resetRateLimit(identifier: string, type: keyof typeof RATE_LIMIT_CONFIGS): void {
  const cache = rateLimiters.get(type)
  if (cache) {
    const key = getRateLimitKey(identifier, type)
    cache.delete(key)
  }
}

// レート制限ミドルウェア
export async function withRateLimit(
  request: Request,
  type: keyof typeof RATE_LIMIT_CONFIGS,
  handler: () => Promise<Response>,
  identifier?: string
): Promise<Response> {
  // 識別子の決定（デフォルトはIPアドレス）
  const id = identifier || getClientIp(request)
  
  // レート制限チェック
  const result = await checkRateLimit(id, type)

  // レート制限ヘッダーの作成
  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
    'Retry-After': result.success ? '0' : Math.ceil((result.reset.getTime() - Date.now()) / 1000).toString()
  })

  if (!result.success) {
    return new Response(JSON.stringify({
      error: 'リクエスト数が制限を超えています。しばらく待ってから再試行してください。',
      retryAfter: result.reset.toISOString()
    }), {
      status: 429,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    })
  }

  // ハンドラーを実行
  const response = await handler()
  
  // レート制限ヘッダーを追加
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })

  return response
}

// 特定のユーザーに対するレート制限（認証後）
export async function checkUserRateLimit(
  userId: string,
  type: keyof typeof RATE_LIMIT_CONFIGS
): Promise<RateLimitResult> {
  return checkRateLimit(`user:${userId}`, type)
}

// IP + User IDの組み合わせでのレート制限
export async function checkCombinedRateLimit(
  request: Request,
  userId: string,
  type: keyof typeof RATE_LIMIT_CONFIGS
): Promise<RateLimitResult> {
  const ip = getClientIp(request)
  return checkRateLimit(`${ip}:${userId}`, type)
}