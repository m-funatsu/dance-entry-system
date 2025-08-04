import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export async function getFaviconUrl(): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data: settings } = await supabase
      .from('system_settings')
      .select('favicon_url')
      .maybeSingle()

    return settings?.favicon_url || null
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
    
    const { data: settings } = await supabase
      .from('system_settings')
      .select('site_title')
      .maybeSingle()

    return settings?.site_title || '2025 バルカーカップ ダンスエントリーシステム'
  } catch (error) {
    logger.error('サイトタイトル取得エラー', error, {
      action: 'get_site_title'
    })
    return '2025 バルカーカップ ダンスエントリーシステム'
  }
}