'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        // エラーメッセージを日本語化
        let errorMessage = 'ログインに失敗しました'
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'パスワードが不正です'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'メールアドレスの確認が完了していません'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'リクエストが多すぎます。しばらく待ってからお試しください'
        }
        setError(errorMessage)
        return
      }

      if (data.user) {
        // プロフィールの存在確認
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        // プロフィールが存在しない場合は作成
        if (!profile && profileError?.code === 'PGRST116') {
          const userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'ユーザー'
          await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                name: userName,
                role: 'participant',
              },
            ])
        }

        // 少し待ってからリダイレクト（Hydrationエラー回避）
        setTimeout(() => {
          router.push('/dashboard')
        }, 100)
      }
    } catch {
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            2025 バルカーカップ•ジャパンオープン•ショーダンス選手権
          </h2>
          <p className="mt-2 text-center text-lg text-gray-600">
            エントリーシステム
          </p>
          <p className="mt-2 text-center text-sm text-gray-600">
            ログインしてください
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <div>
              <Link
                href="/auth/reset-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                パスワードを忘れた方はこちら
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                アカウントをお持ちでない場合は、
                <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                  新規登録
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}