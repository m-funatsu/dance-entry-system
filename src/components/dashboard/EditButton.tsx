'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface EditButtonProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function EditButton({ href, children, className = "font-medium text-indigo-600 hover:text-indigo-500" }: EditButtonProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // 重複クリック防止
    if (isNavigating) {
      console.log('[EDIT BUTTON] Navigation already in progress, ignoring click')
      return
    }

    setIsNavigating(true)
    console.log('[EDIT BUTTON] Navigating to:', href, 'at', new Date().toISOString())
    
    try {
      // 管理者画面では確実にページ遷移するためwindow.location.hrefを使用
      window.location.href = href
    } catch (error) {
      console.error('[EDIT BUTTON] Navigation failed:', error)
      setIsNavigating(false)
    }
  }

  return (
    <button 
      onClick={handleClick}
      disabled={isNavigating}
      className={`cursor-pointer ${isNavigating ? 'opacity-50' : ''} ${className}`}
    >
      {children}
    </button>
  )
}