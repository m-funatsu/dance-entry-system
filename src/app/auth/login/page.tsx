'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavigationLogger from '@/components/NavigationLogger'
import Link from 'next/link'
import BackgroundLoader from '@/components/BackgroundLoader'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitCount, setSubmitCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

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
          console.log('[LOGIN] Creating user profile...')
          const userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'ユーザー'
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                name: userName,
                role: 'participant',
              },
            ])
          
          if (insertError) {
            console.log('[LOGIN] Profile creation error:', insertError)
          } else {
            console.log('[LOGIN] Profile created successfully')
          }
        }

        // 少し待ってからリダイレクト（Hydrationエラー回避）
        console.log('[LOGIN] Preparing to redirect to dashboard...')
        setTimeout(() => {
          console.log('[LOGIN] Executing redirect to /dashboard')
          router.push('/dashboard')
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
    <>
      <NavigationLogger />
      <BackgroundLoader pageType="login" />
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), var(--login-bg-image, none)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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
    </>
  )
}