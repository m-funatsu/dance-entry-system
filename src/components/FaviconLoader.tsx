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
              try {
                if (link && link.parentNode && document.head.contains(link)) {
                  link.parentNode.removeChild(link)
                }
              } catch (e) {
                // DOM操作エラーを無視
                console.log('ファビコン削除をスキップ:', e)
              }
            })

            // 新しいfaviconリンクを追加
            try {
              const link = document.createElement('link')
              link.rel = 'icon'
              link.href = data.favicon_url
              if (document.head && !document.head.querySelector(`link[rel="icon"][href="${data.favicon_url}"]`)) {
                document.head.appendChild(link)
              }

              // shortcut iconも追加
              const shortcutLink = document.createElement('link')
              shortcutLink.rel = 'shortcut icon'
              shortcutLink.href = data.favicon_url
              if (document.head && !document.head.querySelector(`link[rel="shortcut icon"][href="${data.favicon_url}"]`)) {
                document.head.appendChild(shortcutLink)
              }
            } catch (e) {
              console.log('ファビコン追加をスキップ:', e)
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