'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('認証エラー:', error)
          setError('認証に失敗しました')
          return
        }

        const welcome = searchParams.get('welcome') === 'true'
        const name = searchParams.get('name') || ''

        if (data.session) {
          // セッションが取得できた場合（確認完了）
          if (welcome) {
            // ウェルカムメッセージを表示してダッシュボードへ
            alert(`${name ? `${decodeURIComponent(name)}さん、` : ''}バルカーカップへようこそ！アカウントが有効化されました。`)
            router.push('/dashboard')
          } else {
            // 通常の確認完了
            router.push('/dashboard')
          }
        } else {
          // セッションがない場合は確認待ち状態
          if (welcome) {
            alert(`${name ? `${decodeURIComponent(name)}さん、` : ''}ウェルカムメールを確認してください。メール内のリンクをクリックしてアカウントを有効化してください。`)
          }
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('コールバック処理エラー:', err)
        setError('処理中にエラーが発生しました')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, searchParams, supabase.auth])

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
            onClick={() => router.push('/auth/login')}
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