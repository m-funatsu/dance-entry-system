// サーバーサイド専用のCSRF機能
// このファイルはサーバーコンポーネントとAPIルートでのみ使用してください

import { createHash, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24時間

interface CSRFToken {
  token: string
  expires: number
}

// トークンの生成
export function generateCSRFToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

// トークンのハッシュ化（保存用）
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// CSRFトークンの作成と保存
export async function createCSRFToken(): Promise<string> {
  try {
    const token = generateCSRFToken()
    const hashedToken = hashToken(token)
    const expires = Date.now() + CSRF_TOKEN_EXPIRY

    const cookieStore = await cookies()
    
    // HttpOnly, Secure, SameSite=Strictでクッキーに保存
    cookieStore.set(CSRF_COOKIE_NAME, JSON.stringify({
      token: hashedToken,
      expires
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(expires)
    })

    logger.debug('CSRFトークンを生成しました', {
      action: 'create_csrf_token',
      metadata: { expires: new Date(expires).toISOString() }
    })

    return token
  } catch (error) {
    logger.error('CSRFトークン生成エラー', error, {
      action: 'create_csrf_token_error'
    })
    throw new Error('CSRFトークンの生成に失敗しました')
  }
}

// CSRFトークンの検証
export async function verifyCSRFToken(token: string | null): Promise<boolean> {
  if (!token) {
    logger.warn('CSRFトークンが提供されていません', {
      action: 'verify_csrf_token_missing'
    })
    return false
  }

  try {
    const cookieStore = await cookies()
    const storedData = cookieStore.get(CSRF_COOKIE_NAME)

    if (!storedData?.value) {
      logger.warn('保存されたCSRFトークンが見つかりません', {
        action: 'verify_csrf_token_not_found'
      })
      return false
    }

    const { token: storedToken, expires }: CSRFToken = JSON.parse(storedData.value)

    // 有効期限チェック
    if (Date.now() > expires) {
      logger.warn('CSRFトークンの有効期限が切れています', {
        action: 'verify_csrf_token_expired',
        metadata: { expires: new Date(expires).toISOString() }
      })
      return false
    }

    // トークンの比較
    const hashedToken = hashToken(token)
    const isValid = hashedToken === storedToken

    if (!isValid) {
      logger.warn('CSRFトークンが一致しません', {
        action: 'verify_csrf_token_mismatch'
      })
    }

    return isValid
  } catch (error) {
    logger.error('CSRFトークン検証エラー', error, {
      action: 'verify_csrf_token_error'
    })
    return false
  }
}

// リクエストからCSRFトークンを取得
export function getCSRFTokenFromRequest(request: Request): string | null {
  // ヘッダーから取得
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken) return headerToken

  // ボディから取得（FormData）
  const contentType = request.headers.get('content-type')
  if (contentType?.includes('multipart/form-data')) {
    // FormDataの場合は別途処理が必要
    return null
  }

  return null
}

// CSRFトークンをクリア
export async function clearCSRFToken(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(CSRF_COOKIE_NAME)
    
    logger.debug('CSRFトークンをクリアしました', {
      action: 'clear_csrf_token'
    })
  } catch (error) {
    logger.error('CSRFトークンクリアエラー', error, {
      action: 'clear_csrf_token_error'
    })
  }
}

// Next.js App Router用のCSRF保護ミドルウェア
export async function withCSRFProtection(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  // GETリクエストはスキップ
  if (request.method === 'GET' || request.method === 'HEAD') {
    return handler()
  }

  const token = getCSRFTokenFromRequest(request)
  const isValid = await verifyCSRFToken(token)

  if (!isValid) {
    logger.warn('CSRF保護により拒否されました', {
      action: 'csrf_protection_rejected',
      metadata: {
        method: request.method,
        url: request.url
      }
    })

    return new Response(JSON.stringify({ 
      error: 'CSRF検証に失敗しました' 
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return handler()
}