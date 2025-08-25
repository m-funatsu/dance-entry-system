'use client'

import { useState } from 'react'

interface AdminLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function AdminLink({ href, children, className = "" }: AdminLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false)

  const handleClick = () => {
    // 重複クリック防止
    if (isNavigating) {
      console.log('[ADMIN LINK] Navigation already in progress, ignoring click')
      return
    }

    setIsNavigating(true)
    console.log('[ADMIN LINK] Force navigation to:', href)
    
    // 強制的なページ遷移（form submit方式）
    const form = document.createElement('form')
    form.method = 'GET'
    form.action = href
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <button 
      onClick={handleClick}
      disabled={isNavigating}
      className={`text-left ${isNavigating ? 'opacity-50' : ''} ${className}`}
      style={{ all: 'unset', cursor: 'pointer', display: 'inline' }}
    >
      {children}
    </button>
  )
}