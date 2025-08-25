'use client'

import { useEffect } from 'react'

export default function DynamicTitle() {
  useEffect(() => {
    // サイトタイトルを動的に設定
    const updateTitle = async () => {
      try {
        const response = await fetch('/api/admin/settings', {
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          const siteTitle = data.settings?.site_title || "2025 バルカーカップ ダンスエントリーシステム"
          document.title = siteTitle
        }
      } catch (error) {
        console.error('タイトル更新エラー:', error)
        // フォールバック
        document.title = "2025 バルカーカップ ダンスエントリーシステム"
      }
    }

    updateTitle()
  }, [])

  return null
}