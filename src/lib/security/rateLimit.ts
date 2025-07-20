// レート制限の実装
import { NextRequest } from 'next/server'

interface RateLimitConfig {
  interval: number // ウィンドウの長さ（ミリ秒）
  maxRequests: number // 最大リクエスト数
}

// メモリベースのストア（本番環境ではRedisなどを使用推奨）
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// IPアドレスまたはユーザーIDを取得
function getIdentifier(request: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`
  
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return `ip:${ip}`
}

// レート制限チェック
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const identifier = getIdentifier(request, userId)
  const now = Date.now()
  
  const record = requestCounts.get(identifier)
  
  // レコードがない、またはリセット時間を過ぎている場合
  if (!record || now > record.resetTime) {
    const resetTime = now + config.interval
    requestCounts.set(identifier, { count: 1, resetTime })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime
    }
  }
  
  // リクエスト数をインクリメント
  record.count++
  
  // 制限を超えているかチェック
  if (record.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    }
  }
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime
  }
}

// 定期的にメモリをクリーンアップ
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key)
    }
  }
}, 60000) // 1分ごと

// プリセット設定
export const rateLimitConfigs = {
  // API全般：1分間に60リクエスト
  api: {
    interval: 60 * 1000,
    maxRequests: 60
  },
  // ログイン試行：5分間に5回まで
  login: {
    interval: 5 * 60 * 1000,
    maxRequests: 5
  },
  // ファイルアップロード：5分間に10回まで
  upload: {
    interval: 5 * 60 * 1000,
    maxRequests: 10
  },
  // メール送信：1時間に10回まで
  email: {
    interval: 60 * 60 * 1000,
    maxRequests: 10
  }
}