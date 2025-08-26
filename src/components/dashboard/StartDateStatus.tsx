'use client'

import { useEffect, useState } from 'react'
import { checkStartDateAvailability } from '@/lib/start-date-utils'

export function StartDateStatus() {
  const [startDateInfo, setStartDateInfo] = useState<{
    isAvailable: boolean
    startDate: string | null
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkStatus() {
      try {
        const result = await checkStartDateAvailability()
        setStartDateInfo(result)
      } catch (error) {
        console.error('入力開始日状況確認エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [])

  if (loading || !startDateInfo || (startDateInfo.isAvailable && !startDateInfo.message)) {
    return null
  }

  return (
    <div className={`rounded-lg p-4 mb-6 ${
      startDateInfo.isAvailable 
        ? 'bg-green-50 border border-green-200' 
        : 'bg-yellow-50 border border-yellow-200'
    }`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {startDateInfo.isAvailable ? (
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
          <h3 className={`text-sm font-medium ${
            startDateInfo.isAvailable ? 'text-green-800' : 'text-yellow-800'
          }`}>
            {startDateInfo.isAvailable ? '📝 高度な機能が利用可能' : '⏳ 高度な機能の入力開始前'}
          </h3>
          <div className={`text-sm ${
            startDateInfo.isAvailable ? 'text-green-700' : 'text-yellow-700'
          }`}>
            {startDateInfo.isAvailable ? (
              <p>準決勝情報、決勝情報、SNS情報、参加同意書、各種申請の入力ができます。</p>
            ) : (
              <div>
                <p>{startDateInfo.message}</p>
                <p className="mt-1 text-xs">
                  現在は<strong>基本情報</strong>、<strong>予選情報</strong>、<strong>プログラム情報</strong>のみ入力可能です。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}