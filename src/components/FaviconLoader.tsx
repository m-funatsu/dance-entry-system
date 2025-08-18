'use client'

import { useEffect } from 'react'

export default function FaviconLoader() {
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const response = await fetch('/api/admin/favicon')
        if (response.ok) {
          const data = await response.json()
          if (data.favicon_url && typeof document !== 'undefined') {
            // 既存のfaviconリンクを安全に削除
            const existingLinks = document.querySelectorAll('link[rel*="icon"]')
            existingLinks.forEach(link => {
              if (link.parentNode) {
                link.parentNode.removeChild(link)
              }
            })

            // 新しいfaviconリンクを追加
            const link = document.createElement('link')
            link.rel = 'icon'
            link.href = data.favicon_url
            if (document.head) {
              document.head.appendChild(link)
            }

            // shortcut iconも追加
            const shortcutLink = document.createElement('link')
            shortcutLink.rel = 'shortcut icon'
            shortcutLink.href = data.favicon_url
            if (document.head) {
              document.head.appendChild(shortcutLink)
            }
          }
        }
      } catch (error) {
        console.log('ファビコン読み込みをスキップ:', error)
      }
    }

    // DOM準備完了後に実行
    if (typeof document !== 'undefined' && document.readyState === 'complete') {
      loadFavicon()
    } else {
      window.addEventListener('load', loadFavicon)
      return () => window.removeEventListener('load', loadFavicon)
    }
  }, [])

  return null
}