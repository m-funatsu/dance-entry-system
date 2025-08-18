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

    // 既存ユーザーかチェック（usersテーブルから確認）
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      // 既存ユーザーの場合もサインアップ確認メールを送信するため、
      // メール確認状態をリセットしてからresendを使用
      try {
        // ユーザーのメール確認状態をリセット
        const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
          existingUser.id,
          { email_confirm: false }
        )

        if (updateError) {
          console.error('User update error:', updateError)
          // エラーが発生してもパスワードリセットメールにフォールバック
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
        } else {
          // メール確認状態をリセット後、サインアップ確認メールを送信
          const { error: resendError } = await adminSupabase.auth.resend({
            type: 'signup',
            email: email,
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?welcome=true&name=${encodeURIComponent(name || '')}`
            }
          })

          if (resendError) {
            console.error('Signup confirmation email error:', resendError)
            return NextResponse.json(
              { error: 'ウェルカム確認メールの送信に失敗しました' },
              { status: 500 }
            )
          }
        }
      } catch (error) {
        console.error('Error processing existing user:', error)
        return NextResponse.json(
          { error: 'ウェルカムメールの送信に失敗しました' },
          { status: 500 }
        )
      }
    } else {
      // 新規ユーザーの場合はサインアップ確認メールを送信
      const { data: newUser, error: signupError } = await adminSupabase.auth.admin.createUser({
        email: email,
        email_confirm: false, // メール確認が必要
        user_metadata: {
          name: name || '',
          welcome_message: true
        }
      })

      if (signupError) {
        console.error('User creation error:', signupError)
        return NextResponse.json(
          { error: 'アカウント作成に失敗しました' },
          { status: 500 }
        )
      }

      // usersテーブルにレコードを作成
      if (newUser.user) {
        const { error: userInsertError } = await adminSupabase
          .from('users')
          .insert({
            id: newUser.user.id,
            email: email,
            name: name || '',
            role: 'participant'
          })

        if (userInsertError) {
          console.error('User table insert error:', userInsertError)
          // 認証ユーザーは作成されているので、エラーは警告レベルに留める
        }
      }

      // サインアップ確認メールを再送信
      const { error: resendError } = await adminSupabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?welcome=true&name=${encodeURIComponent(name || '')}`
        }
      })

      if (resendError) {
        console.error('Signup confirmation email error:', resendError)
        return NextResponse.json(
          { error: 'ウェルカム確認メールの送信に失敗しました' },
          { status: 500 }
        )
      }
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