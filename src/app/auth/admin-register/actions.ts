'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function createAdminUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password || !name) {
    return { error: 'すべてのフィールドを入力してください' }
  }

  try {
    // 管理者権限でユーザーアカウントを直接作成（メール確認不要）
    const adminSupabase = createAdminClient()
    
    // 管理者権限でユーザーを作成
    const { data: adminUserData, error: adminError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認を自動で完了
      user_metadata: {
        name: name
      }
    })

    if (adminError) {
      console.error('管理者アカウント作成エラー:', adminError)
      // エラーメッセージを日本語化
      let errorMessage = '管理者登録に失敗しました'
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
        console.error('管理者プロフィール作成エラー:', profileError)
        return { error: `管理者プロフィールの作成に失敗しました: ${profileError.message}` }
      }

      // 成功時はリダイレクト
      redirect('/auth/login?message=管理者アカウントが作成されました。ログインしてください。')
    }

    return { error: 'アカウント作成に失敗しました' }
  } catch (error) {
    console.error('予期しないエラー:', error)
    return { error: '登録に失敗しました。詳細はサーバーログを確認してください。' }
  }
}