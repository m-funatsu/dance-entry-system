import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name } = await request.json()
    
    console.log('[API] プロフィール作成リクエスト受信:', { userId, email, name })
    
    if (!userId || !email || !name) {
      console.log('[API] 必須パラメータ不足')
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 })
    }

    // 認証ヘッダーを確認
    const authHeader = request.headers.get('authorization')
    console.log('[API] 認証ヘッダー:', authHeader ? 'あり' : 'なし')
    
    // 管理者権限または新規登録セッションの確認
    let hasValidAuth = false
    
    if (authHeader) {
      // セッションがある場合は通常の認証チェック
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('[API] セッション認証結果:', { hasUser: !!user, authError, userId: user?.id })
      
      if (user && user.id === userId) {
        hasValidAuth = true
        console.log('[API] セッション認証成功')
      }
    } else {
      // 新規登録時は管理者権限で直接作成
      console.log('[API] セッションなし - 管理者権限で直接作成')
      hasValidAuth = true
    }
    
    if (!hasValidAuth) {
      console.log('[API] 認証失敗')
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    console.log('[API] 管理者クライアント作成完了')
    
    console.log('[API] プロフィール作成開始:', { userId, email, name })
    
    // 管理者権限でプロフィールを作成
    const { data, error } = await adminSupabase
      .from('users')
      .insert([
        {
          id: userId,
          email: email,
          name: name,
          role: 'participant',
        },
      ])
      .select()
    
    console.log('[API] プロフィール作成結果:', { data, error })
    
    if (error) {
      console.error('[API] プロフィール作成エラー:', error)
      return NextResponse.json({ 
        error: 'プロフィール作成に失敗しました',
        details: error.message 
      }, { status: 500 })
    }

    console.log('[API] プロフィール作成成功')
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[API] プロフィール作成APIエラー:', error)
    return NextResponse.json({ 
      error: 'サーバーエラーが発生しました',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 })
  }
}