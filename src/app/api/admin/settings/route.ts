import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // 管理者クライアントを使用して設定を取得
    const adminSupabase = createAdminClient()
    const { data: settings, error } = await adminSupabase
      .from('settings')
      .select('*')
      .order('key', { ascending: true })

    if (error) {
      console.error('設定取得エラー:', error)
      return NextResponse.json({ error: '設定の取得に失敗しました' }, { status: 500 })
    }

    // 設定をキーバリュー形式に変換
    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {} as Record<string, string>) || {}

    return NextResponse.json({ settings: settingsMap })
  } catch (error) {
    console.error('設定API エラー:', error)
    return NextResponse.json(
      { error: 'システムエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // リクエストボディを取得
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: '無効な設定データです' }, { status: 400 })
    }

    // 管理者クライアントを使用
    const adminSupabase = createAdminClient()

    // 各設定を更新または挿入
    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      const { error } = await adminSupabase
        .from('settings')
        .upsert({
          key,
          value: String(value),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        })

      if (error) {
        console.error(`設定更新エラー (${key}):`, error)
        throw error
      }
    })

    // すべての設定を更新
    await Promise.all(updatePromises)

    return NextResponse.json({ 
      success: true,
      message: '設定を保存しました' 
    })
  } catch (error) {
    console.error('設定保存エラー:', error)
    return NextResponse.json(
      { error: '設定の保存に失敗しました' },
      { status: 500 }
    )
  }
}