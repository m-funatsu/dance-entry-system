'use client'

import { useEffect, useState } from 'react'
import { checkStartDateAvailability, type AdvancedSection } from '@/lib/start-date-utils'

interface StartDateNoticeProps {
  section: AdvancedSection
  className?: string
  onAvailabilityChange?: (isAvailable: boolean) => void
}

export function StartDateNotice({ section, className = '', onAvailabilityChange }: StartDateNoticeProps) {
  const [isAvailable, setIsAvailable] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAvailability() {
      console.log('[START DATE NOTICE] === コンポーネント開始 ===')
      console.log('[START DATE NOTICE] section:', section)
      try {
        const result = await checkStartDateAvailability()
        console.log('[START DATE NOTICE] チェック結果:', result)
        setIsAvailable(result.isAvailable)
        setMessage(result.message)
        
        console.log('[START DATE NOTICE] State更新:', {
          isAvailable: result.isAvailable,
          message: result.message
        })
        
        // 親コンポーネントに利用可能状況を通知
        if (onAvailabilityChange) {
          console.log('[START DATE NOTICE] 親コンポーネントに通知:', result.isAvailable)
          onAvailabilityChange(result.isAvailable)
        }
      } catch (error) {
        console.error('[START DATE NOTICE] エラー:', error)
        setIsAvailable(true) // エラー時は利用可能として扱う
        setMessage('入力開始日の確認に失敗しました。')
      } finally {
        console.log('[START DATE NOTICE] loading終了')
        setLoading(false)
      }
    }

    checkAvailability()
  }, [section, onAvailabilityChange])

  console.log('[START DATE NOTICE] === レンダリング判定 ===')
  console.log('[START DATE NOTICE] loading:', loading)
  console.log('[START DATE NOTICE] isAvailable:', isAvailable)
  console.log('[START DATE NOTICE] message:', message)

  if (loading) {
    console.log('[START DATE NOTICE] → loading画面表示')
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 animate-pulse ${className}`}>
        <div className="h-12 bg-gray-100 rounded"></div>
      </div>
    )
  }

  // 入力不可の場合は、警告と戻るボタンのみ表示（フォーム自体を非表示にする）
  if (!isAvailable) {
    console.log('[START DATE NOTICE] → 入力制限画面表示')
    console.log('[START DATE NOTICE] 表示メッセージ:', message)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">入力開始日前です</h3>
              <p className="text-sm text-gray-600 mb-4">{message}</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>現在入力可能なセクション：</strong><br />
                  • 基本情報<br />
                  • 予選情報<br />
                  • プログラム情報
                </p>
              </div>
              
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                ← ダッシュボードに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 利用可能で特にメッセージがない場合は表示しない
  if (isAvailable && !message) {
    console.log('[START DATE NOTICE] → 利用可能、メッセージなし（非表示）')
    return null
  }

  // 利用可能だがメッセージがある場合（確認メッセージなど）
  console.log('[START DATE NOTICE] → 利用可能、メッセージあり（確認表示）')
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-green-800">✅ 入力可能</p>
          <p className="text-sm text-green-700">{message}</p>
        </div>
      </div>
    </div>
  )
}