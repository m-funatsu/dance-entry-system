'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // 正しいリダイレクトURLを生成
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/update-password`,
      })

      if (error) {
        let errorMessage = 'パスワードリセットに失敗しました'
        if (error.message.includes('Email not found')) {
          errorMessage = 'このメールアドレスは登録されていません'
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'このメールアドレスは既に登録されています'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'リクエストが多すぎます。しばらく待ってからお試しください'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = '有効なメールアドレスを入力してください'
        }
        setError(errorMessage)
        return
      }

      setMessage('パスワードリセットメールを送信しました。メールをご確認ください。')
    } catch {
      setError('パスワードリセットに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            パスワードリセット
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            登録されたメールアドレスを入力してください
          </p>
        </div>
        
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-green-700 text-sm">{message}</div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'メール送信中...' : 'パスワードリセットメールを送信'}
            </button>
          </div>

          <div className="text-center space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="text-yellow-800 text-sm">
                <p className="font-medium">※ 重要なお知らせ</p>
                <p>パスワードの再発行メールは「noreply@mail.app.supabase」から送信されます。もしメールが受信されない場合は迷惑メールフォルダに自動分類されている可能性があるためご注意ください。</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                console.log('🔸 [RESET_PASSWORD] ログインページに戻るクリック')
                window.location.href = '/auth/login'
              }}
              className="font-medium text-indigo-600 hover:text-indigo-500 bg-transparent border-none cursor-pointer underline"
            >
              ログインページに戻る
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}