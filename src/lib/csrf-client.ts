'use client'

import { logger } from '@/lib/logger'

// クライアントサイド用のCSRF関数

// CSRFトークンをローカルストレージから取得
export function getCSRFTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    return localStorage.getItem('csrf-token')
  } catch {
    return null
  }
}

// CSRFトークンをローカルストレージに保存
export function setCSRFTokenToStorage(token: string): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('csrf-token', token)
  } catch (error) {
    logger.warn('CSRFトークンの保存に失敗', {
      action: 'set_csrf_token_storage_error',
      metadata: { error: String(error) }
    })
  }
}

// CSRFトークンをローカルストレージから削除
export function clearCSRFTokenFromStorage(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('csrf-token')
  } catch (error) {
    logger.warn('CSRFトークンの削除に失敗', {
      action: 'clear_csrf_token_storage_error',
      metadata: { error: String(error) }
    })
  }
}

// APIリクエスト用のヘッダーにCSRFトークンを追加
export function addCSRFHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getCSRFTokenFromStorage()
  
  if (!token) {
    logger.warn('CSRFトークンが見つかりません', {
      action: 'csrf_token_missing'
    })
    return headers
  }

  return {
    ...headers,
    'X-CSRF-Token': token
  }
}

// fetch関数のラッパー（CSRF保護付き）
export async function securedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = addCSRFHeader(init?.headers)
  
  return fetch(input, {
    ...init,
    headers,
    credentials: 'include' // クッキーを含める
  })
}