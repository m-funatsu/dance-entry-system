'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'

interface BackgroundLoaderProps {
  pageType: 'login' | 'dashboard' | 'entry' | 'music'
}

export default function BackgroundLoader({ pageType }: BackgroundLoaderProps) {
  useEffect(() => {
    const loadBackgroundImage = async () => {
      try {
        const supabase = createClient()
        const settingKey = `${pageType}_background_image`
        const cssVar = `--${pageType}-bg-image`
        
        console.log(`背景画像読み込み開始: ${settingKey}`)
        
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', settingKey)
          .maybeSingle()
        
        console.log(`背景画像クエリ結果:`, { data, error, settingKey })
        
        if (data?.value && typeof document !== 'undefined' && document.documentElement) {
          // CSS変数を設定
          console.log(`背景画像を設定: ${cssVar} = url(${data.value})`)
          document.documentElement.style.setProperty(cssVar, `url(${data.value})`)
          
          logger.debug(`背景画像を設定: ${cssVar}`, {
            action: 'set_background_image',
            metadata: { pageType, cssVar, value: data.value }
          })
        } else {
          console.log(`背景画像が見つかりません: ${settingKey}`, { data, hasDocument: typeof document !== 'undefined', hasDocumentElement: !!document?.documentElement })
          
          logger.debug(`背景画像が見つかりません: ${settingKey}`, {
            action: 'background_image_not_found',
            metadata: { pageType, settingKey }
          })
        }
      } catch (error) {
        console.error(`${pageType}背景画像の読み込みエラー:`, error)
        
        logger.warn(`${pageType}背景画像の読み込みに失敗`, {
          action: 'load_background_image_failed',
          metadata: { pageType, error: String(error) }
        })
      }
    }

    loadBackgroundImage()
  }, [pageType])

  return null // このコンポーネントは何も描画しない
}