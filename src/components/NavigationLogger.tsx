'use client'

import { useEffect } from 'react'

export default function NavigationLogger() {
  useEffect(() => {
    // クリックイベントの監視
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // リンクやボタンのクリックをログ出力
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
        const element = target.closest('a, button') || target
        const href = element.getAttribute('href')
        const text = element.textContent?.trim()
        
        console.log('[NAVIGATION LOG] Click detected:', {
          element: element.tagName,
          href: href,
          text: text,
          timestamp: new Date().toISOString(),
          target: target,
          currentUrl: window.location.href
        })
      }
    }

    // ページ遷移の監視
    const handleBeforeUnload = () => {
      console.log('[NAVIGATION LOG] Page unloading from:', window.location.href)
    }

    // ページ読み込み完了の監視
    const handleLoad = () => {
      console.log('[NAVIGATION LOG] Page loaded:', window.location.href)
    }

    // popstate（戻る・進むボタン）の監視
    const handlePopState = (event: PopStateEvent) => {
      console.log('[NAVIGATION LOG] PopState event:', {
        state: event.state,
        url: window.location.href
      })
    }

    // イベントリスナーの設定
    document.addEventListener('click', handleClick, true)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('load', handleLoad)
    window.addEventListener('popstate', handlePopState)

    console.log('[NAVIGATION LOG] NavigationLogger initialized on:', window.location.href)

    // クリーンアップ
    return () => {
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('load', handleLoad)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return null // このコンポーネントは何も描画しない
}