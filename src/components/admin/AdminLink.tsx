'use client'

import { useState } from 'react'

interface AdminLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function AdminLink({ href, children, className = "" }: AdminLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // 重複クリック防止
    if (isNavigating) {
      console.log('[ADMIN LINK] Navigation already in progress, ignoring click')
      return
    }

    setIsNavigating(true)
    console.log('[ADMIN LINK] Navigating to:', href, 'at', new Date().toISOString())
    
    // 複数の方法でページ遷移を試行
    try {
      console.log('[ADMIN LINK] 方法1: window.location.href')
      window.location.href = href
      
      // フォールバック
      setTimeout(() => {
        console.log('[ADMIN LINK] 方法2: window.location.assign')
        window.location.assign(href)
        
        setTimeout(() => {
          console.log('[ADMIN LINK] 方法3: window.location.replace')
          window.location.replace(href)
        }, 500)
      }, 500)
    } catch (error) {
      console.error('[ADMIN LINK] Navigation error:', error)
      // 最終手段として標準のリンク動作を使用
      window.open(href, '_self')
    }
  }

  return (
    <a 
      href={href}
      onClick={handleClick}
      className={`cursor-pointer ${isNavigating ? 'opacity-50' : ''} ${className}`}
    >
      {children}
    </a>
  )
}