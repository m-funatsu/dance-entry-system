import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'メールアドレスが必要です' }, { status: 400 })
    }

    // 管理者クライアントを使用
    const adminSupabase = createAdminClient()

    // パスワードリセットメールをウェルカムメールとして送信
    const { error: resetError } = await adminSupabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password?welcome=true&name=${encodeURIComponent(name || '')}`
      }
    )

    if (resetError) {
      console.error('Welcome email error:', resetError)
      return NextResponse.json(
        { error: 'ウェルカムメールの送信に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: `${name || email}さんへウェルカムメールを送信しました` 
    })

  } catch (error) {
    console.error('Send welcome email error:', error)
    return NextResponse.json(
      { error: 'メール送信処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}