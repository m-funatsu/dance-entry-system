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
    </div>
  )
}