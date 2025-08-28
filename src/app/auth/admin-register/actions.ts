'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function createAdminUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password || !name) {
    return { error: 'すべてのフィールドを入力してください' }
  }

  // 入力検証
  if (password.length < 8) {
    return { error: 'パスワードは8文字以上である必要があります' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: '有効なメールアドレスを入力してください' }
  }

  console.log('Input validation passed:', { email, nameLength: name.length, passwordLength: password.length })

  try {
    // 管理者権限でユーザーアカウントを直接作成（メール確認不要）
    const adminSupabase = createAdminClient()
    
    // 管理者権限でユーザーを作成
    const { data: adminUserData, error: adminError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認を自動で完了
      phone_confirm: true, // 電話番号確認も自動で完了
      user_metadata: {
        name: name
      },
      app_metadata: {
        role: 'admin'
      }
    })

    if (adminError) {
      // 詳細なエラー情報を表示（一時的）
      console.error('Admin registration error details:', {
        message: adminError.message,
        code: adminError.status,
        fullError: adminError
      })
      
      // エラーメッセージを日本語化
      let errorMessage = `管理者登録に失敗しました: ${adminError.message}`
      if (adminError.message.includes('User already registered')) {
        errorMessage = 'このメールアドレスは既に登録されています'
      } else if (adminError.message.includes('Password should be at least')) {
        errorMessage = 'パスワードは8文字以上である必要があります'
      } else if (adminError.message.includes('Invalid email')) {
        errorMessage = '有効なメールアドレスを入力してください'
      } else if (adminError.message.includes('Too many requests')) {
        errorMessage = 'リクエストが多すぎます。しばらく待ってからお試しください'
      } else if (adminError.message.includes('Password')) {
        errorMessage = `パスワード要件エラー: ${adminError.message}`
      }
      return { error: errorMessage }
    }

    if (adminUserData?.user) {
      // 管理者プロフィールを作成
      const { error: profileError } = await adminSupabase
        .from('users')
        .upsert({
          id: adminUserData.user.id,
          email: adminUserData.user.email,
          name: name,
          role: 'admin'
        })

      if (profileError) {
        return { error: `管理者プロフィールの作成に失敗しました: ${profileError.message}` }
      }

      // 成功時は成功フラグを返す
      return { success: true, message: '管理者アカウントが作成されました。ログインしてください。' }
    }

    return { error: 'アカウント作成に失敗しました' }
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? `登録に失敗しました: ${error.message}` 
      : '登録に失敗しました'
    
    return { error: errorMessage }
  }
}