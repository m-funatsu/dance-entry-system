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
    console.log('[REGISTER] 新規登録開始', { email, name, passwordLength: password.length })
    setLoading(true)
    setError('')

    console.log('[REGISTER] パスワード検証開始')
    // パスワード検証
    const errors = validatePassword(password)
    if (errors.length > 0) {
      console.log('[REGISTER] パスワード検証エラー:', errors)
      setValidationErrors(errors)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      console.log('[REGISTER] パスワード不一致エラー')
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    try {
      console.log('[REGISTER] メール重複チェック開始')
      // メール重複チェック
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.trim())
        .limit(1)

      console.log('[REGISTER] メール重複チェック結果:', { 
        existingUsers, 
        checkError,
        existingCount: existingUsers?.length || 0 
      })

      if (checkError) {
        console.error('[REGISTER] メール重複チェックでエラー:', checkError)
        setError('メール確認中にエラーが発生しました')
        setLoading(false)
        return
      }

      if (existingUsers && existingUsers.length > 0) {
        console.log('[REGISTER] 既存メールアドレス検出')
        setError('このメールアドレスは既に登録されています')
        setLoading(false)
        return
      }
      
      console.log('[REGISTER] Supabase認証サインアップ開始')
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          }
        }
      })

      console.log('[REGISTER] Supabase認証サインアップ結果:', { 
        hasData: !!data, 
        hasUser: !!data?.user,
        userId: data?.user?.id,
        hasError: !!error,
        errorMessage: error?.message,
        errorCode: error?.code || error?.status
      })

      if (error) {
        console.error('[REGISTER] Supabase認証エラー:', error)
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
        console.log('[REGISTER] 日本語エラーメッセージ:', errorMessage)
        setError(errorMessage)
        return
      }

      if (data.user) {
        console.log('[REGISTER] ユーザー作成成功:', {
          userId: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at,
          userMetadata: data.user.user_metadata
        })
        
        console.log('[REGISTER] プロフィール作成試行開始')
        // プロフィールをusersテーブルに作成
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                name: name.trim(),
                role: 'participant',
              },
            ])
            .select()
          
          console.log('[REGISTER] プロフィール作成結果:', {
            profileData,
            profileError,
            hasProfileData: !!profileData
          })
          
          if (profileError) {
            console.error('[REGISTER] プロフィール作成エラー:', profileError)
          } else {
            console.log('[REGISTER] プロフィール作成成功')
          }
        } catch (profileCreateError) {
          console.error('[REGISTER] プロフィール作成で例外:', profileCreateError)
        }
        
        console.log('[REGISTER] 登録完了 - ログインページにリダイレクト')
        
        // デバッグ用：リダイレクト前にログを確認できるよう一時停止
        alert('✅ 登録が完了しました！\nコンソールログを確認してから「OK」を押してください。\n\n確認メールをお送りしましたので、メール内のリンクをクリックしてアカウントを有効化してください。')
        
        console.log('[REGISTER] === 登録処理完了サマリー ===')
        console.log('ユーザーID:', data.user.id)
        console.log('メールアドレス:', data.user.email)
        console.log('名前:', name.trim())
        console.log('=================================')
        
        window.location.href = '/auth/login?message=登録が完了しました。ログインしてください。'
      } else {
        console.error('[REGISTER] ユーザーデータが返されませんでした:', data)
        alert('❌ 登録処理でエラーが発生しました\nコンソールログを確認してください')
        setError('登録処理でエラーが発生しました')
      }
    } catch (error) {
      console.error('[REGISTER] 登録処理で例外発生:', error)
      alert('❌ 登録に失敗しました\nコンソールログでエラー詳細を確認してください')
      setError('登録に失敗しました')
    } finally {
      console.log('[REGISTER] 登録処理終了')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center font-extrabold leading-tight">
            <div style={{color: 'black', fontSize: '36px'}}>
              2025バルカーカップ
            </div>
          </h1>
          <p className="mt-2 text-center" style={{color: 'black', fontSize: '36px'}}>
            エントリーシステム
          </p>
          <p className="mt-2 text-center" style={{color: 'black', fontSize: '21px'}}>
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