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
    console.log('[START DATE INLINE] チェック対象:', section, '制御対象:', isAdvancedSection(section))
    
    // 入力開始日制御対象でない場合は何も表示しない
    if (!isAdvancedSection(section)) {
      console.log('[START DATE INLINE] 制御対象外のため非表示')
      return
    }

    async function checkStatus() {
      try {
        console.log('[START DATE INLINE] 状況チェック開始:', section)
        const result = await checkStartDateAvailability()
        console.log('[START DATE INLINE] チェック結果:', result)
        setStartStatus({
          isAvailable: result.isAvailable,
          message: result.message
        })
        console.log('[START DATE INLINE] State設定完了:', {
          isAvailable: result.isAvailable,
          message: result.message
        })
      } catch (error) {
        console.error('[START DATE INLINE] エラー:', error)
      }
    }

    checkStatus()
  }, [section])

  console.log('[START DATE INLINE] === レンダリング判定 ===')
  console.log('[START DATE INLINE] 制御対象:', isAdvancedSection(section))
  console.log('[START DATE INLINE] startStatus:', startStatus)
  console.log('[START DATE INLINE] startStatus?.isAvailable:', startStatus?.isAvailable)

  // 制御対象外または利用可能な場合は表示しない
  if (!isAdvancedSection(section) || !startStatus || startStatus.isAvailable) {
    console.log('[START DATE INLINE] → 非表示（制御対象外または利用可能）')
    return null
  }

  console.log('[START DATE INLINE] → 入力開始前メッセージ表示')

  return (
    <dd className="text-xs mt-1 text-yellow-600">
      ⏳ 入力開始前（9/1から利用可能）
    </dd>
  )
}