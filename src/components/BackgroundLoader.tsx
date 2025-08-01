'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
        
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', settingKey)
          .maybeSingle()
        
        if (data?.value) {
          // CSS変数を設定
          console.log(`Setting ${cssVar} to: ${data.value}`)
          document.documentElement.style.setProperty(cssVar, `url(${data.value})`)
        } else {
          console.log(`No background image found for ${settingKey}`)
        }
      } catch (error) {
        console.log(`${pageType}背景画像の読み込みに失敗:`, error)
      }
    }

    loadBackgroundImage()
  }, [pageType])

  return null // このコンポーネントは何も描画しない
}