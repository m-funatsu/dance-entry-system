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
    
    // 管理者画面では確実にページ遷移するためwindow.location.hrefを使用
    window.location.href = href
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