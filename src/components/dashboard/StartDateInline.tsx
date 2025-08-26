'use client'

import { useEffect, useState } from 'react'
import { checkStartDateAvailability, isAdvancedSection } from '@/lib/start-date-utils'

interface StartDateInlineProps {
  section: string
}

export function StartDateInline({ section }: StartDateInlineProps) {
  const [startStatus, setStartStatus] = useState<{
    isAvailable: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    // 入力開始日制御対象でない場合は何も表示しない
    if (!isAdvancedSection(section)) {
      return
    }

    async function checkStatus() {
      try {
        const result = await checkStartDateAvailability()
        setStartStatus({
          isAvailable: result.isAvailable,
          message: result.message
        })
      } catch (error) {
        console.error('入力開始日状況確認エラー:', error)
      }
    }

    checkStatus()
  }, [section])

  // 制御対象外または利用可能な場合は表示しない
  if (!isAdvancedSection(section) || !startStatus || startStatus.isAvailable) {
    return null
  }

  return (
    <dd className="text-xs mt-1 text-yellow-600">
      ⏳ 入力開始前（9/1から利用可能）
    </dd>
  )
}