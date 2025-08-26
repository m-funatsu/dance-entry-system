'use client'

import { useState, useEffect } from 'react'

interface SiteTitleProps {
  fallback?: string
  className?: string
  style?: React.CSSProperties
  splitMode?: 'single' | 'double' // single: 1行表示, double: 2行表示
}

export default function SiteTitle({ 
  fallback = "2025 バルカーカップ ダンスエントリーシステム", 
  className = "",
  style,
  splitMode = 'single'
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

  if (splitMode === 'double') {
    // 2行表示モード
    // 「2025 バルカーカップ」と「残り」で分割
    if (title.includes('バルカーカップ')) {
      const splitIndex = title.indexOf('バルカーカップ') + 'バルカーカップ'.length
      const firstLine = title.substring(0, splitIndex)
      const secondLine = title.substring(splitIndex).trim()
      
      return (
        <div className={className} style={style}>
          <div>{firstLine}</div>
          {secondLine && <div>{secondLine}</div>}
        </div>
      )
    } else {
      // バルカーカップが含まれない場合は最初の2単語で分割
      const parts = title.split(' ')
      if (parts.length >= 2) {
        return (
          <div className={className} style={style}>
            <div>{parts[0]} {parts[1]}</div>
            <div>{parts.slice(2).join(' ')}</div>
          </div>
        )
      }
    }
  }

  return <span className={className} style={style}>{title}</span>
}