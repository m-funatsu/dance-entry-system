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
      try {
        const result = await checkStartDateAvailability()
        setIsAvailable(result.isAvailable)
        setMessage(result.message)
        
        // 親コンポーネントに利用可能状況を通知
        if (onAvailabilityChange) {
          onAvailabilityChange(result.isAvailable)
        }
        
        // 入力不可の場合、フォーム要素を無効化
        if (!result.isAvailable) {
          const formElements = document.querySelectorAll('input, textarea, select, button')
          formElements.forEach(element => {
            (element as HTMLElement).style.pointerEvents = 'none'
            element.setAttribute('disabled', 'true')
          })
        }
      } catch (error) {
        console.error('入力開始日チェックエラー:', error)
        setIsAvailable(true) // エラー時は利用可能として扱う
        setMessage('入力開始日の確認に失敗しました。')
      } finally {
        setLoading(false)
      }
    }

    checkAvailability()
  }, [section, onAvailabilityChange])

  if (loading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 animate-pulse ${className}`}>
        <div className="h-12 bg-gray-100 rounded"></div>
      </div>
    )
  }

  if (isAvailable && !message) {
    return null // 利用可能で特にメッセージがない場合は表示しない
  }

  return (
    <div className={`rounded-lg p-4 mb-6 ${
      isAvailable 
        ? 'bg-green-50 border border-green-200' 
        : 'bg-yellow-50 border border-yellow-200'
    } ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {isAvailable ? (
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${
            isAvailable ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {isAvailable ? '✅ 入力可能' : '⏳ 入力開始前'}
          </p>
          {message && (
            <p className={`text-sm ${
              isAvailable ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {message}
            </p>
          )}
        </div>
      </div>
      
      {!isAvailable && (
        <div className="mt-3 p-3 bg-yellow-100 rounded-md">
          <p className="text-xs text-yellow-800">
            このセクションはまだ入力できません。管理者が設定した入力開始日をお待ちください。
          </p>
        </div>
      )}
      
      {/* フォーム無効化オーバーレイ */}
      {!isAvailable && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-40 pointer-events-none">
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50 max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">入力開始日前です</h3>
              <p className="text-sm text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}