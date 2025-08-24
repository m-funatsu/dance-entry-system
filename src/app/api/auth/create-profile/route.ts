import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name } = await request.json()
    
    if (!userId || !email || !name) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    
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