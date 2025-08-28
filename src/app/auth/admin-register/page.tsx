'use client'

import { createAdminClient } from '@/lib/supabase/admin'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminRegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    try {
      // 管理者権限でユーザーアカウントを直接作成（メール確認不要）
      let adminSupabase
      try {
        adminSupabase = createAdminClient()
      } catch (configError) {
        console.error('Admin client creation failed:', configError)
        setError('管理者機能の設定が不正です。Vercelの環境変数を確認してください。')
        return
      }
      
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
        setError(errorMessage)
        return
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
          setError(`管理者プロフィールの作成に失敗しました: ${profileError.message}`)
          return
        }

        router.push('/auth/login?message=管理者アカウントが作成されました。ログインしてください。')
      }
    } catch (error) {
      console.error('予期しないエラー:', error)
      setError('登録に失敗しました。詳細はコンソールを確認してください。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            管理者アカウント作成
          </h2>
          <p className="mt-2 text-center text-sm text-red-600">
            ⚠️ 開発用のページです。本番環境では削除してください。
          </p>
          <p className="mt-1 text-center text-xs text-gray-600">
            環境変数エラーが出る場合は、Vercelダッシュボードで<br/>
            SUPABASE_SERVICE_ROLE_KEYを設定してください。
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                氏名
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="氏名"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                パスワード確認
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード確認"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '作成中...' : '管理者アカウント作成'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              ログインページに戻る
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}