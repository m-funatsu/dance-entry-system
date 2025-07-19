import { createClient } from '@/lib/supabase/server'

export async function getFaviconUrl(): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data: settings } = await supabase
      .from('system_settings')
      .select('favicon_url')
      .single()

    return settings?.favicon_url || null
  } catch (error) {
    console.error('ファビコン取得エラー:', error)
    return null
  }
}

export async function getSiteTitle(): Promise<string> {
  try {
    const supabase = await createClient()
    
    const { data: settings } = await supabase
      .from('system_settings')
      .select('site_title')
      .single()

    return settings?.site_title || '2025 バルカーカップ ダンスエントリーシステム'
  } catch (error) {
    console.error('サイトタイトル取得エラー:', error)
    return '2025 バルカーカップ ダンスエントリーシステム'
  }
}