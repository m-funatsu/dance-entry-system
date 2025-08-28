'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function createAdminUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  console.log('createAdminUser called with:', { email, name, passwordLength: password?.length })

  if (!email || !password || !name) {
    return { error: 'すべてのフィールドを入力してください' }
  }

  try {
    // 管理者権限でユーザーアカウントを直接作成（メール確認不要）
    console.log('Creating admin client...')
    const adminSupabase = createAdminClient()
    console.log('Admin client created successfully')
    
    // 管理者権限でユーザーを作成
    console.log('Creating user with admin privileges...')
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
      console.error('管理者アカウント作成エラー:', {
        message: adminError.message,
        code: adminError.status,
        details: adminError
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
      }
      return { error: errorMessage }
    }

    console.log('User created successfully:', { userId: adminUserData?.user?.id })

    if (adminUserData?.user) {
      // 管理者プロフィールを作成
      console.log('Creating user profile in database...')
      const { error: profileError } = await adminSupabase
        .from('users')
        .upsert({
          id: adminUserData.user.id,
          email: adminUserData.user.email,
          name: name,
          role: 'admin'
        })

      if (profileError) {
        console.error('管理者プロフィール作成エラー:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError
        })
        return { error: `管理者プロフィールの作成に失敗しました: ${profileError.message}` }
      }

      console.log('User profile created successfully')

      // 成功時は成功フラグを返す
      return { success: true, message: '管理者アカウントが作成されました。ログインしてください。' }
    }

    return { error: 'アカウント作成に失敗しました（ユーザーデータが空です）' }
  } catch (error) {
    console.error('予期しないエラー:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error
    })
    
    const errorMessage = error instanceof Error 
      ? `登録に失敗しました: ${error.message}` 
      : '登録に失敗しました。詳細はサーバーログを確認してください。'
    
    return { error: errorMessage }
  }
}