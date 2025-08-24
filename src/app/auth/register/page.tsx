'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const supabase = createClient()

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('8文字以上で入力してください')
    }
    if (password.length > 20) {
      errors.push('20文字以内で入力してください')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('大文字を1文字以上含めてください')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('小文字を1文字以上含めてください')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('数字を1文字以上含めてください')
    }
    
    return errors
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // パスワード検証
    const errors = validatePassword(password)
    if (errors.length > 0) {
      setValidationErrors(errors)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    try {
      // メール重複チェック
      const { data: existingUsers } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.trim())
        .limit(1)

      if (existingUsers && existingUsers.length > 0) {
        setError('このメールアドレスは既に登録されています')
        setLoading(false)
        return
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      })

      if (error) {
        // エラーメッセージを日本語化
        let errorMessage = '登録に失敗しました'
        if (error.message.includes('User already registered')) {
          errorMessage = 'このメールアドレスは既に登録されています'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'メールアドレスの確認が完了していません'
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'パスワードは8文字以上である必要があります'
        } else if (error.message.includes('Invalid email')) {
          errorMessage = '有効なメールアドレスを入力してください'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'リクエストが多すぎます。しばらく待ってからお試しください'
        }
        setError(errorMessage)
        return
      }

      if (data.user) {
        // トリガーによってプロフィールが自動作成されるか、
        // メール確認後にログイン時に作成される
        window.location.href = '/auth/login?message=登録が完了しました。ログインしてください。'
      }
    } catch {
      setError('登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center font-extrabold leading-tight">
            <div style={{color: '#FFD700', fontSize: '36px'}}>
              2025バルカーカップ
            </div>
          </h1>
          <p className="mt-2 text-center" style={{color: '#FFD700', fontSize: '36px'}}>
            エントリーシステム
          </p>
          <p className="mt-2 text-center" style={{color: '#FFD700', fontSize: '21px'}}>
            新規アカウント登録
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                お名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="お名前"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
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
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setValidationErrors(validatePassword(e.target.value))
                }}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                パスワード（確認）
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="パスワード（確認）"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">パスワードの要件:</h4>
              {validationErrors.map((error, index) => (
                <p key={index} className="text-sm text-yellow-700">• {error}</p>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">パスワードの要件:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 8文字以上20文字以内</li>
              <li>• 大文字を1文字以上</li>
              <li>• 小文字を1文字以上</li>
              <li>• 数字を1文字以上</li>
            </ul>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || validationErrors.length > 0}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '登録中...' : '新規登録'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              すでにアカウントをお持ちの場合は、
              <a href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                ログイン
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}