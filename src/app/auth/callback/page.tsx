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
      
      try {
        // URLハッシュを直接処理（Supabase auth exchange）
        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        console.log('[CALLBACK] URLハッシュ:', hash)
        
        // ハッシュがある場合はauth exchangeを実行
        if (hash) {
          console.log('[CALLBACK] URLハッシュ処理実行')
          
          const hashParams = new URLSearchParams(hash.substring(1))
          const access_token = hashParams.get('access_token')
          const refresh_token = hashParams.get('refresh_token')
          const type = hashParams.get('type')
          
          console.log('[CALLBACK] ハッシュパラメータ:', { type, hasAccessToken: !!access_token, hasRefreshToken: !!refresh_token })
          
          if (access_token && refresh_token) {
            console.log('[CALLBACK] トークンでセッション設定')
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token
            })
            
            if (error) {
              console.error('[CALLBACK] セッション設定エラー:', error)
              
              // パスワードリセットの場合は特別なエラーメッセージ
              if (type === 'recovery') {
                setError('認証セッションが無効です。パスワードリセットメールを再送信してください。')
              } else {
                setError('認証に失敗しました。メールリンクを再度クリックしてください。')
              }
              return
            }
            
            console.log('[CALLBACK] セッション設定成功、type:', type)
            
            // パスワードリセットの場合
            if (type === 'recovery') {
              console.log('[CALLBACK] パスワードリセット → update-passwordへ')
              window.location.href = '/auth/update-password'
              return
            }
            
            // 通常のメール確認の場合
            console.log('[CALLBACK] メール確認完了 → dashboardへ')
            window.location.href = '/dashboard'
            return
          }
        }
        
        // ハッシュがない場合の従来型処理
        console.log('[CALLBACK] ハッシュなし - クエリパラメータ確認')
        const welcome = searchParams.get('welcome') === 'true'
        const name = searchParams.get('name') || ''
        
        console.log('[CALLBACK] welcome:', welcome, 'name:', name)
        
        // 現在のセッション確認
        const { data: currentSession } = await supabase.auth.getSession()
        
        if (currentSession?.session) {
          console.log('[CALLBACK] 既存セッション確認 → dashboardへ')
          if (welcome) {
            alert(`${name ? `${decodeURIComponent(name)}さん、` : ''}バルカーカップへようこそ！`)
          }
          window.location.href = '/dashboard'
        } else {
          console.log('[CALLBACK] セッション無効 - confirm-emailページへ')
          const params = new URLSearchParams()
          if (welcome) params.append('welcome', 'true')
          if (name) params.append('name', name)
          
          window.location.href = `/auth/confirm-email?${params.toString()}`
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