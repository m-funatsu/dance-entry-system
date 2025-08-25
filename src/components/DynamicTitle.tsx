'use client'

import { useEffect } from 'react'

export default function DynamicTitle() {
  useEffect(() => {
    // サイトタイトルを動的に設定
    const updateTitle = async () => {
      console.log('[DYNAMIC TITLE] タイトル更新開始')
      try {
        console.log('[DYNAMIC TITLE] 公開API呼び出し中...')
        const response = await fetch('/api/public/site-title', {
          cache: 'no-store'
        })
        
        console.log('[DYNAMIC TITLE] API応答:', response.status, response.statusText)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[DYNAMIC TITLE] 取得データ:', data)
          const siteTitle = data.title || "2025 バルカーカップ ダンスエントリーシステム"
          console.log('[DYNAMIC TITLE] 設定するタイトル:', siteTitle)
          document.title = siteTitle
          console.log('[DYNAMIC TITLE] タイトル設定完了:', document.title)
        } else {
          console.error('[DYNAMIC TITLE] API失敗:', response.status)
          // 認証失敗の場合はデフォルトタイトルを使用
          document.title = "2025 バルカーカップ ダンスエントリーシステム"
        }
      } catch (error) {
        console.error('[DYNAMIC TITLE] タイトル更新エラー:', error)
        // フォールバック
        document.title = "2025 バルカーカップ ダンスエントリーシステム"
      }
    }

    updateTitle()
  }, [])

  return null
}