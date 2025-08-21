'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function URLCleaner() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // URLにセンシティブ情報が含まれている場合はクリア
    const params = new URLSearchParams(searchParams.toString())
    const sensitiveParams = [
      'access_token',
      'refresh_token',
      'token_type',
      'expires_in',
      'expires_at',
      'email',
      'password'
    ]

    let hasSensitiveData = false
    sensitiveParams.forEach(param => {
      if (params.has(param)) {
        hasSensitiveData = true
      }
    })

    if (hasSensitiveData) {
      // センシティブなパラメータをすべて削除
      sensitiveParams.forEach(param => {
        params.delete(param)
      })

      // URLを更新（ブラウザ履歴から認証情報を除去）
      const cleanUrl = params.toString() 
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname

      window.history.replaceState({}, document.title, cleanUrl)
      
      console.log('URLからセンシティブ情報をクリアしました')
    }
  }, [searchParams])

  return null // このコンポーネントは何も描画しない
}