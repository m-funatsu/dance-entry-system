import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // 管理者クライアントを使用してサイトタイトルのみ取得
    const adminSupabase = createAdminClient()
    const { data: titleSetting, error } = await adminSupabase
      .from('settings')
      .select('value')
      .eq('key', 'site_title')
      .maybeSingle()

    if (error) {
      console.error('サイトタイトル取得エラー:', error)
      return NextResponse.json({ 
        title: "2025 バルカーカップ ダンスエントリーシステム" 
      })
    }

    return NextResponse.json({ 
      title: titleSetting?.value || "2025 バルカーカップ ダンスエントリーシステム"
    })
  } catch (error) {
    console.error('公開サイトタイトルAPI エラー:', error)
    return NextResponse.json({ 
      title: "2025 バルカーカップ ダンスエントリーシステム" 
    })
  }
}