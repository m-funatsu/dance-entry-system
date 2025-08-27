'use client'

import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function CallbackContent() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('[CALLBACK] === 認証コールバック処理開始 ===')
      console.log('[CALLBACK] 現在のURL:', typeof window !== 'undefined' ? window.location.href : 'N/A')
      console.log('[CALLBACK] searchParams:', searchParams)
      
      try {
        // URLのハッシュフラグメントを確認
        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        const hashParams = new URLSearchParams(hash.substring(1))
        const type = searchParams.get('type') || hashParams.get('type')
        const access_token = hashParams.get('access_token')
        
        console.log('[CALLBACK] URLパラメータ type:', type)
        console.log('[CALLBACK] access_token存在:', !!access_token)
        
        // アクセストークンがハッシュに含まれている場合、セッション交換を試行
        if (access_token) {
          console.log('[CALLBACK] ハッシュからトークン検出、セッション交換実行')
          const { error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('[CALLBACK] セッション交換エラー:', error)
            // セッション交換に失敗した場合、手動で交換を試行
            console.log('[CALLBACK] 手動セッション交換を試行')
            const refresh_token = hashParams.get('refresh_token')
            if (refresh_token) {
              const { error: setSessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token
              })
              if (setSessionError) {
                console.error('[CALLBACK] 手動セッション設定エラー:', setSessionError)
              }
            }
          }
        }
        
        // パスワードリセット用のコールバックの場合
        if (type === 'recovery') {
          console.log('[CALLBACK] パスワードリセット処理開始')
          
          // パスワードリセットの場合は直接update-passwordページへ
          console.log('[CALLBACK] パスワードリセット → update-passwordへリダイレクト')
          window.location.href = '/auth/update-password'
          return
        }

        // 通常のメール確認コールバック処理
        console.log('[CALLBACK] 通常のメール確認処理開始')
        const { data, error } = await supabase.auth.getSession()
        
        console.log('[CALLBACK] セッション取得結果:', {
          hasData: !!data,
          hasSession: !!data?.session,
          hasUser: !!data?.session?.user,
          userId: data?.session?.user?.id,
          error: error
        })
        
        if (error) {
          console.error('[CALLBACK] 認証エラー:', error)
          setError('認証に失敗しました')
          return
        }

        const welcome = searchParams.get('welcome') === 'true'
        const name = searchParams.get('name') || ''
        
        console.log('[CALLBACK] URLパラメータ welcome:', welcome)
        console.log('[CALLBACK] URLパラメータ name:', name)

        if (data.session) {
          console.log('[CALLBACK] セッション有効 → ダッシュボードへリダイレクト')
          // URLから認証情報をクリア（セキュリティ対策）
          window.history.replaceState({}, document.title, '/auth/callback')
          
          // セッションが取得できた場合（確認完了）
          if (welcome) {
            // ウェルカムメッセージを表示してダッシュボードへ
            alert(`${name ? `${decodeURIComponent(name)}さん、` : ''}バルカーカップへようこそ！アカウントが有効化されました。`)
            console.log('[CALLBACK] ウェルカムメッセージ後 → dashboardへ')
            window.location.href = '/dashboard'
          } else {
            // 通常の確認完了
            console.log('[CALLBACK] 通常確認完了 → dashboardへ')
            window.location.href = '/dashboard'
          }
        } else {
          console.log('[CALLBACK] ⚠️ セッション無効 → loginへリダイレクト')
          console.log('[CALLBACK] これが原因でloginに飛ばされている')
          // セッションがない場合は確認待ち状態
          if (welcome) {
            alert(`${name ? `${decodeURIComponent(name)}さん、` : ''}ウェルカムメールを確認してください。メール内のリンクをクリックしてアカウントを有効化してください。`)
          }
          window.location.href = '/auth/login'
        }
      } catch (err) {
        console.error('コールバック処理エラー:', err)
        setError('処理中にエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [searchParams, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">認証を処理中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium">{error}</div>
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            ログインページへ
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}