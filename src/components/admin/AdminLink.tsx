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
    console.log('[ADMIN LINK] === クリック検出 ===')
    console.log('[ADMIN LINK] 現在時刻:', new Date().toISOString())
    console.log('[ADMIN LINK] 遷移先:', href)
    console.log('[ADMIN LINK] 現在のURL:', window.location.href)
    
    // 重複クリック防止
    if (isNavigating) {
      console.log('[ADMIN LINK] Navigation already in progress, ignoring click')
      return
    }

    setIsNavigating(true)
    console.log('[ADMIN LINK] ナビゲーション開始 - isNavigating: true')
    
    const startTime = performance.now()
    console.log('[ADMIN LINK] パフォーマンス計測開始:', startTime)
    
    try {
      console.log('[ADMIN LINK] フォーム要素作成開始')
      
      // 強制的なページ遷移（form submit方式）
      const form = document.createElement('form')
      form.method = 'GET'
      form.action = href
      form.style.display = 'none'
      
      console.log('[ADMIN LINK] フォーム設定完了:', {
        method: form.method,
        action: form.action,
        style: form.style.display
      })
      
      console.log('[ADMIN LINK] フォームをDOMに追加')
      document.body.appendChild(form)
      
      console.log('[ADMIN LINK] フォーム送信実行前')
      const beforeSubmit = performance.now()
      console.log('[ADMIN LINK] 送信前経過時間:', beforeSubmit - startTime, 'ms')
      
      form.submit()
      
      const afterSubmit = performance.now()
      console.log('[ADMIN LINK] フォーム送信実行完了')
      console.log('[ADMIN LINK] 送信処理時間:', afterSubmit - beforeSubmit, 'ms')
      console.log('[ADMIN LINK] 総経過時間:', afterSubmit - startTime, 'ms')
      
      // クリーンアップ
      setTimeout(() => {
        if (document.body.contains(form)) {
          document.body.removeChild(form)
          console.log('[ADMIN LINK] フォーム要素をクリーンアップ')
        }
      }, 1000)
      
    } catch (error) {
      console.error('[ADMIN LINK] フォーム送信エラー:', error)
      console.log('[ADMIN LINK] エラー発生時刻:', new Date().toISOString())
      setIsNavigating(false)
    }
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