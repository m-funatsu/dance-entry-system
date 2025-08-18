import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageType: string }> }
) {
  try {
    const { pageType } = await params
    
    // 有効なページタイプかチェック
    const validPageTypes = ['login', 'dashboard', 'entry', 'music']
    if (!validPageTypes.includes(pageType)) {
      return NextResponse.json({ error: '無効なページタイプです' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const settingKey = `${pageType}_background_image`
    
    const { data: setting, error } = await adminSupabase
      .from('settings')
      .select('value')
      .eq('key', settingKey)
      .maybeSingle()

    if (error) {
      console.error('背景画像設定取得エラー:', error)
      return NextResponse.json({ error: '背景画像設定の取得に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({
      background_url: setting?.value || null,
      pageType,
      settingKey
    })
  } catch (error) {
    console.error('背景画像API エラー:', error)
    return NextResponse.json(
      { error: 'システムエラーが発生しました' },
      { status: 500 }
    )
  }
}