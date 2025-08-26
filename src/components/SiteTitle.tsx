'use client'

import { useState, useEffect } from 'react'

interface SiteTitleProps {
  fallback?: string
  className?: string
  style?: React.CSSProperties
}

export default function SiteTitle({ 
  fallback = "2025 バルカーカップ ダンスエントリーシステム", 
  className = "",
  style 
}: SiteTitleProps) {
  const [title, setTitle] = useState(fallback)

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const response = await fetch('/api/public/site-title', {
          cache: 'no-store'
        })
        
        if (response.ok) {
          const data = await response.json()
          setTitle(data.title || fallback)
        }
      } catch (error) {
        console.error('SiteTitle取得エラー:', error)
        setTitle(fallback)
      }
    }

    fetchTitle()
  }, [fallback])

  return <span className={className} style={style}>{title}</span>
}