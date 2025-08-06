'use client'

import { useEffect, useState } from 'react'
import { DeadlineNotice } from './DeadlineNotice'
import { getDeadline, type DeadlineKey } from '@/lib/deadline-utils'
import { getDeadlineFromConfig } from '@/lib/deadline-config'

interface DeadlineNoticeAsyncProps {
  deadlineKey: DeadlineKey
  className?: string
}

export function DeadlineNoticeAsync({ deadlineKey, className = '' }: DeadlineNoticeAsyncProps) {
  const [deadline, setDeadline] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDeadline() {
      try {
        const fetchedDeadline = await getDeadline(deadlineKey)
        
        if (fetchedDeadline) {
          setDeadline(fetchedDeadline)
        } else {
          // データベースから取得できない場合はハードコードされた値を使用
          const configDeadline = getDeadlineFromConfig(deadlineKey)
          setDeadline(configDeadline)
        }
      } catch (error) {
        // エラーの場合もハードコードされた値を使用
        const configDeadline = getDeadlineFromConfig(deadlineKey)
        setDeadline(configDeadline)
      } finally {
        setLoading(false)
      }
    }

    fetchDeadline()
  }, [deadlineKey])

  if (loading) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 animate-pulse ${className}`}>
        <div className="h-16 bg-blue-100 rounded"></div>
      </div>
    )
  }

  if (!deadline) {
    // 期限が設定されていない場合はデフォルトの期限を表示
    return <DeadlineNotice deadline="期限は管理者にお問い合わせください" className={className} />
  }

  return <DeadlineNotice deadline={deadline} className={className} />
}