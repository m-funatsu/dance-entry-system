'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import NavigationLogger from '@/components/NavigationLogger'
import BackgroundLoader from '@/components/BackgroundLoader'
import SiteTitle from '@/components/SiteTitle'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [submitCount, setSubmitCount] = useState(0)
  const searchParams = useSearchParams()
  const supabase = createClient()

  // URLパラメータからメッセージを取得
  useEffect(() => {
    const message = searchParams.get('message')
    console.log('🔍 [LOGIN] URLパラメータ確認:', { message, url: window.location.href })
    if (message) {
      const decodedMessage = decodeURIComponent(message)
      console.log('✅ [LOGIN] メッセージ設定:', decodedMessage)
      setSuccessMessage(decodedMessage)
    } else {
      console.log('❌ [LOGIN] メッセージなし')
    }
  }, [searchParams])

  // ページ読み込み時にURLハッシュをチェック
  useEffect(() => {
    const handleAuthCallback = () => {
      if (typeof window === 'undefined') return
      
      const hash = window.location.hash
      if (hash) {
        console.log('[LOGIN] URLハッシュ検出:', hash)
        const hashParams = new URLSearchParams(hash.substring(1))
        const type = hashParams.get('type')
        const access_token = hashParams.get('access_token')
        
        console.log('[LOGIN] type:', type, 'access_token存在:', !!access_token)
        
        // パスワードリセット用のトークンが含まれている場合
        if (type === 'recovery' || access_token) {
          console.log('[LOGIN] 認証トークン検出 - callbackページにリダイレクト')
          // ハッシュを保持してcallbackページにリダイレクト
          window.location.href = `/auth/callback${hash}`
        }
      }
    }
    
    handleAuthCallback()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    const currentSubmitCount = submitCount + 1
    setSubmitCount(currentSubmitCount)
    
    console.log('[LOGIN] Form submission triggered at', new Date().toISOString(), {
      submitCount: currentSubmitCount,
      currentLoadingState: loading
    })
    e.preventDefault()
    
    // 重複送信防止
    if (loading) {
      console.log('[LOGIN] Login already in progress, ignoring submission (attempt #' + currentSubmitCount + ')')
      return
    }
    
    console.log('[LOGIN] Setting loading state to true (attempt #' + currentSubmitCount + ')')
    setLoading(true)
    setError('')
    console.log('[LOGIN] Login attempt started at', new Date().toISOString(), {
      email: email,
      submitCount: currentSubmitCount,
      formElement: e.target,
      eventType: e.type
    })

    try {
      console.log('[LOGIN] Calling Supabase signInWithPassword...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })
      
      console.log('[LOGIN] Supabase response received:', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        hasError: !!error,
        errorMessage: error?.message 
      })

      if (error) {
        console.log('[LOGIN] Login error:', error)
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
        console.log('[LOGIN] User authenticated successfully:', data.user.email)
        
        // プロフィールの存在確認
        console.log('[LOGIN] Checking user profile...')
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        console.log('[LOGIN] Profile check result:', { 
          hasProfile: !!profile, 
          profileError: profileError?.code 
        })

        // プロフィールが存在しない場合は作成
        if (!profile && profileError?.code === 'PGRST116') {
          console.log('[LOGIN] Creating user profile via API...')
          const userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'ユーザー'
          
          try {
            const profileResponse = await fetch('/api/auth/create-profile', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: data.user.id,
                email: data.user.email,
                name: userName
              })
            })
            
            const profileResult = await profileResponse.json()
            console.log('[LOGIN] Profile creation API result:', profileResult)
            
            if (!profileResponse.ok) {
              console.error('[LOGIN] Profile creation API error:', profileResult)
            } else {
              console.log('[LOGIN] Profile created successfully via API')
            }
          } catch (apiError) {
            console.error('[LOGIN] Profile creation API exception:', apiError)
          }
        }

        // 少し待ってからリダイレクト（Hydrationエラー回避）
        console.log('[LOGIN] Preparing to redirect to dashboard...')
        setTimeout(() => {
          console.log('[LOGIN] Executing redirect to /dashboard with window.location.href')
          window.location.href = '/dashboard'
        }, 100)
      }
    } catch (catchError) {
      console.log('[LOGIN] Unexpected error during login:', catchError)
      setError('ログインに失敗しました')
    } finally {
      console.log('[LOGIN] Setting loading state to false')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8" style={{
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), var(--login-bg-image, none)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
    <div className="max-w-md w-full space-y-6 sm:space-y-8">
      <div>
        <h1 className="mt-4 sm:mt-6 text-center font-extrabold leading-tight">
          <SiteTitle 
            fallback="2025バルカーカップ ダンスエントリーシステム"
            style={{color: '#FFD700', fontSize: '36px', lineHeight: '1.2'}}
            splitMode="double"
          />
        </h1>
        <p className="mt-2 text-center" style={{color: '#FFD700', fontSize: '21px'}}>
          ログインしてください
        </p>
      </div>
      <form className="mt-6 sm:mt-8 space-y-6" onSubmit={handleLogin}>
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
              className="appearance-none rounded-none relative block w-full px-3 py-3 sm:py-2 border border-gray-300 placeholder-gray-500 text-black font-medium rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base sm:text-sm bg-white"
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
              className="appearance-none rounded-none relative block w-full px-3 py-3 sm:py-2 border border-gray-300 placeholder-gray-500 text-black font-medium rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base sm:text-sm bg-white"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {successMessage && (
          <div className="text-green-600 text-sm text-center bg-green-50 border border-green-200 rounded-md p-3">
            {successMessage}
          </div>
        )}
        
        {/* デバッグ用: successMessageの状態確認 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 text-center">
            DEBUG: successMessage = &quot;{successMessage || 'なし'}&quot;
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-md p-3">
            {error}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent text-base sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </div>

        <div className="text-center space-y-3 sm:space-y-2">
          <div>
            <button
              type="button"
              onClick={() => {
                console.log('🔸 [LOGIN] パスワード忘れリンククリック')
                window.location.href = '/auth/reset-password'
              }}
              className="bg-transparent border-none cursor-pointer underline"
              style={{color: 'rgb(217,217,217)', fontSize: '16.5px'}}
            >
              パスワードを忘れた方はこちら
            </button>
          </div>
          <div>
            <p>
              <span 
                className="block sm:inline"
                style={{color: '#FFD700', fontSize: '16.5px'}}
              >
                アカウントをお持ちでない場合は、
              </span>
              <button
                type="button"
                onClick={() => {
                  console.log('🔸 [LOGIN] 新規登録リンククリック')
                  window.location.href = '/auth/register'
                }}
                className="cursor-pointer underline bg-transparent border-none"
                style={{color: 'rgb(217,217,217)', fontSize: '16.5px'}}
              >
                新規登録
              </button>
            </p>
          </div>
        </div>
      </form>
    </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <>
      <NavigationLogger />
      <BackgroundLoader pageType="login" />
      <Suspense fallback={<div>読み込み中...</div>}>
        <LoginForm />
      </Suspense>
    </>
  )
}