'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function UpdatePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isFirstTime, setIsFirstTime] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // URLパラメータから初回ログインかどうかを判定
    const firstTime = searchParams.get('first_time') === 'true'
    setIsFirstTime(firstTime)

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // パスワードリセットセッションが有効
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth, searchParams])

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError('パスワードの更新に失敗しました')
        return
      }

      // パスワード更新成功
      if (isFirstTime) {
        // 初回ログインの場合は、ダッシュボードへ直接リダイレクト
        alert('アカウントが正常に作成されました。ダッシュボードへ移動します。')
        router.push('/dashboard')
      } else {
        alert('パスワードが更新されました')
        router.push('/auth/login')
      }
    } catch {
      setError('パスワードの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isFirstTime ? 'アカウントの初期設定' : '新しいパスワードを設定'}
          </h2>
          {isFirstTime && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-center text-sm text-blue-800">
                ダンスエントリーシステムへようこそ！<br />
                エントリー登録が完了しました。<br />
                安全なパスワードを設定して、アカウントを有効化してください。
              </p>
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              新しいパスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="新しいパスワード"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setValidationErrors(validatePassword(e.target.value))
              }}
            />
            {validationErrors.length > 0 && (
              <div className="mt-2">
                {validationErrors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600">• {error}</p>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              パスワード確認
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="パスワード確認"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

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
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || validationErrors.length > 0}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '更新中...' : 'パスワードを更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">読み込み中...</div>}>
      <UpdatePasswordForm />
    </Suspense>
  )
}