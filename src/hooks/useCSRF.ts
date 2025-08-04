'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { 
  getCSRFTokenFromStorage, 
  setCSRFTokenToStorage
  // clearCSRFTokenFromStorage 
} from '@/lib/csrf-client'

interface UseCSRFReturn {
  csrfToken: string | null
  loading: boolean
  error: string | null
  refreshToken: () => Promise<void>
}

// CSRFトークンを取得するフック
export function useCSRF(): UseCSRFReturn {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCSRFToken = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('CSRFトークンの取得に失敗しました')
      }

      const data = await response.json()
      const token = data.token
      
      // ローカルストレージに保存
      setCSRFTokenToStorage(token)
      setCsrfToken(token)
      
      logger.debug('CSRFトークンを取得しました', {
        action: 'fetch_csrf_token_success'
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'CSRFトークンの取得に失敗しました'
      setError(message)
      logger.error('CSRFトークン取得エラー', err, {
        action: 'fetch_csrf_token_error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // まずローカルストレージから取得を試みる
    const storedToken = getCSRFTokenFromStorage()
    if (storedToken) {
      setCsrfToken(storedToken)
      setLoading(false)
    } else {
      fetchCSRFToken()
    }
  }, [])

  return {
    csrfToken,
    loading,
    error,
    refreshToken: fetchCSRFToken
  }
}

// APIリクエスト時にCSRFトークンを含めるヘルパー関数（非推奨: csrf-clientのaddCSRFHeaderを使用）
export function withCSRFHeaders(headers: HeadersInit = {}, csrfToken: string | null): HeadersInit {
  console.warn('withCSRFHeaders is deprecated. Use addCSRFHeader from csrf-client instead.')
  
  if (!csrfToken) return headers

  return {
    ...headers,
    'X-CSRF-Token': csrfToken
  }
}