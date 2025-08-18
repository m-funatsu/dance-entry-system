'use client'

import { useEffect } from 'react'

export default function FaviconLoader() {
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const response = await fetch('/api/admin/favicon')
        if (response.ok) {
          const data = await response.json()
          if (data.favicon_url) {
            // 既存のfaviconリンクを削除
            const existingLinks = document.querySelectorAll('link[rel*="icon"]')
            existingLinks.forEach(link => link.remove())

            // 新しいfaviconリンクを追加
            const link = document.createElement('link')
            link.rel = 'icon'
            link.href = data.favicon_url
            document.head.appendChild(link)

            // shortcut iconも追加
            const shortcutLink = document.createElement('link')
            shortcutLink.rel = 'shortcut icon'
            shortcutLink.href = data.favicon_url
            document.head.appendChild(shortcutLink)
          }
        }
      } catch (error) {
        console.log('ファビコン読み込みをスキップ:', error)
      }
    }

    loadFavicon()
  }, [])

  return null
}