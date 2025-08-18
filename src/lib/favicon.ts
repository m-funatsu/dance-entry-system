import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function getFaviconUrl(): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'favicon_url')
      .maybeSingle()

    return setting?.value || null
  } catch (error) {
    logger.error('ファビコン取得エラー', error, {
      action: 'get_favicon_url'
    })
    return null
  }
}

export async function getSiteTitle(): Promise<string> {
  try {
    const supabase = await createClient()
    
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'site_title')
      .maybeSingle()

    return setting?.value || '2025 バルカーカップ ダンスエントリーシステム'
  } catch (error) {
    logger.error('サイトタイトル取得エラー', error, {
      action: 'get_site_title'
    })
    return '2025 バルカーカップ ダンスエントリーシステム'
  }
}