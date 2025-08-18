'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

interface BackgroundLoaderProps {
  pageType: 'login' | 'dashboard' | 'entry' | 'music'
}

export default function BackgroundLoader({ pageType }: BackgroundLoaderProps) {
  useEffect(() => {
    let isMounted = true
    
    const loadBackgroundImage = async () => {
      try {
        const settingKey = `${pageType}_background_image`
        const cssVar = `--${pageType}-bg-image`
        
        console.log(`背景画像読み込み開始: ${settingKey}`)
        
        // APIエンドポイント経由で背景画像を取得（RLS制限を回避）
        const response = await fetch(`/api/admin/background/${pageType}`)
        
        if (!isMounted) return
        
        if (!response.ok) {
          console.log(`背景画像API エラー: ${response.status} ${response.statusText}`)
          return
        }
        
        const result = await response.json()
        
        if (!isMounted) return
        
        console.log(`背景画像API結果:`, { result, settingKey })
        
        if (result.background_url && typeof document !== 'undefined' && document.documentElement) {
          // CSS変数を設定
          console.log(`背景画像を設定: ${cssVar} = url(${result.background_url})`)
          document.documentElement.style.setProperty(cssVar, `url(${result.background_url})`)
          
          logger.debug(`背景画像を設定: ${cssVar}`, {
            action: 'set_background_image',
            metadata: { pageType, cssVar, value: result.background_url }
          })
        } else {
          console.log(`背景画像が見つかりません: ${settingKey}`, { result, hasDocument: typeof document !== 'undefined', hasDocumentElement: !!document?.documentElement })
          
          logger.debug(`背景画像が見つかりません: ${settingKey}`, {
            action: 'background_image_not_found',
            metadata: { pageType, settingKey }
          })
        }
      } catch (error) {
        if (!isMounted) return
        
        console.error(`${pageType}背景画像の読み込みエラー:`, error)
        
        logger.warn(`${pageType}背景画像の読み込みに失敗`, {
          action: 'load_background_image_failed',
          metadata: { pageType, error: String(error) }
        })
      }
    }

    loadBackgroundImage()
    
    return () => {
      isMounted = false
    }
  }, [pageType])

  return null // このコンポーネントは何も描画しない
}