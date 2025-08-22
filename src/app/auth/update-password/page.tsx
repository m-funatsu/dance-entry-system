'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import URLCleaner from '@/components/URLCleaner'

function UpdatePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [isWelcome, setIsWelcome] = useState(false)
  const [userName, setUserName] = useState('')
  const [clickCount, setClickCount] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // URLパラメータから初回ログインかどうかを判定
    const firstTime = searchParams.get('first_time') === 'true'
    const welcome = searchParams.get('welcome') === 'true'
    const name = searchParams.get('name') || ''
    
    setIsFirstTime(firstTime)
    setIsWelcome(welcome)
    setUserName(decodeURIComponent(name))

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
      // 現在の認証状態を確認
      const { data: { session } } = await supabase.auth.getSession()
      console.log('現在のセッション状態:', session)
      
      if (!session) {
        // セッションが無効な場合、URLパラメータから認証情報を確認
        const urlParams = new URLSearchParams(window.location.search)
        const accessToken = urlParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          // URLから認証情報を設定
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (sessionError) {
            console.error('セッション設定エラー:', sessionError)
            setError('認証セッションの設定に失敗しました。パスワードリセットメールを再送信してください。')
            return
          }
        } else {
          setError('認証セッションが無効です。パスワードリセットメールを再送信してください。')
          return
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('パスワード更新エラー詳細:', error)
        
        // エラーメッセージを日本語化
        let errorMessage = 'パスワードの更新に失敗しました'
        if (error.message.includes('New password should be different from the old password')) {
          errorMessage = '新しいパスワードは現在のパスワードと異なるものを設定してください'
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'パスワードは8文字以上で設定してください'
        } else if (error.message.includes('weak password')) {
          errorMessage = 'より強力なパスワードを設定してください'
        } else {
          errorMessage = `パスワードの更新に失敗しました: ${error.message}`
        }
        
        setError(errorMessage)
        return
      }

      // パスワード更新成功
      setSuccess(true)
      if (isWelcome) {
        // ウェルカムメールからの場合
        setSuccessMessage(`${userName ? `${userName}さん、` : ''}パスワードが設定されました。下記のボタンからログインしてください。`)
      } else if (isFirstTime) {
        // 初回ログインの場合は、ダッシュボードへ直接リダイレクト
        setSuccessMessage('アカウントが正常に作成されました。下記のボタンからダッシュボードにアクセスしてください。')
      } else {
        setSuccessMessage('パスワードが更新されました。下記のボタンからログインしてください。')
      }
    } catch {
      setError('パスワードの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 成功画面を表示
  if (success) {
    console.log('🔸 [SUCCESS_SCREEN] 成功画面表示中', { isFirstTime, isWelcome, successMessage })
    return (
      <>
        <URLCleaner />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                パスワード更新完了
              </h2>
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-center text-sm text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {isFirstTime && !isWelcome ? (
                <button
                  onClick={() => {
                    console.log('🔸 [DASHBOARD_BUTTON] ダッシュボードボタンクリック')
                    router.push('/dashboard')
                  }}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ダッシュボードへ移動
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    const currentCount = clickCount + 1
                    setClickCount(currentCount)
                    console.log(`🔸 [LOGIN_BUTTON] クリック回数: ${currentCount}`)
                    console.log('🔸 [LOGIN_BUTTON] クリックイベント開始')
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('🔸 [LOGIN_BUTTON] イベント制御完了')
                    
                    // セッションクリアしてからリダイレクト
                    console.log('🔸 [LOGIN_BUTTON] サインアウト開始')
                    supabase.auth.signOut()
                      .then(() => {
                        console.log('🔸 [LOGIN_BUTTON] サインアウト成功')
                      })
                      .catch((error) => {
                        console.log('🔸 [LOGIN_BUTTON] サインアウトエラー:', error)
                      })
                      .finally(() => {
                        console.log('🔸 [LOGIN_BUTTON] リダイレクト実行中...')
                        setTimeout(() => {
                          console.log('🔸 [LOGIN_BUTTON] window.location.replace実行')
                          window.location.replace('/auth/login')
                        }, 100)
                      })
                  }}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ログイン画面へ移動
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <URLCleaner />
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isWelcome ? 'バルカーカップへようこそ！' : isFirstTime ? 'アカウントの初期設定' : '新しいパスワードを設定'}
          </h2>
          {isWelcome && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-center text-sm text-green-800">
                {userName && `${userName}さん、`}バルカーカップダンスエントリーシステムへようこそ！<br />
                管理者からの招待を受けてアカウントが作成されました。<br />
                安全なパスワードを設定して、システムにアクセスしてください。
              </p>
            </div>
          )}
          {isFirstTime && !isWelcome && (
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
    </>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">読み込み中...</div>}>
      <UpdatePasswordForm />
    </Suspense>
  )
}