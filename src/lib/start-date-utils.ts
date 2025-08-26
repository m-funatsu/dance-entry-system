import { createClient } from '@/lib/supabase/client'

/**
 * 入力開始日制御対象のセクション
 */
export const advancedSections = [
  'semifinals',
  'finals', 
  'sns',
  'consent_form',
  'optional_request'
] as const

export type AdvancedSection = typeof advancedSections[number]

/**
 * 入力開始日が設定されているかを確認し、現在時刻と比較
 */
export async function checkStartDateAvailability(): Promise<{
  isAvailable: boolean
  startDate: string | null
  message: string
}> {
  try {
    console.log('[START DATE] === 入力開始日チェック開始 ===')
    console.log('[START DATE] 現在時刻:', new Date().toISOString())
    
    const supabase = createClient()
    
    // advanced_start_dateを取得
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'advanced_start_date')
      .maybeSingle()

    console.log('[START DATE] データベース取得結果:', { data, error })

    if (error) {
      console.error('[START DATE] 入力開始日取得エラー:', error)
      return {
        isAvailable: true,
        startDate: null,
        message: '入力開始日の取得に失敗しました。管理者にお問い合わせください。'
      }
    }

    // 入力開始日が設定されていない場合は常に利用可能
    if (!data?.value) {
      console.log('[START DATE] 入力開始日未設定 → 常に利用可能')
      return {
        isAvailable: true,
        startDate: null,
        message: ''
      }
    }

    const startDate = new Date(data.value)
    const now = new Date()
    
    console.log('[START DATE] 設定された開始日:', startDate.toISOString())
    console.log('[START DATE] 現在時刻:', now.toISOString())
    console.log('[START DATE] 比較結果 (now >= startDate):', now >= startDate)

    if (now >= startDate) {
      // 入力開始日を過ぎている（利用可能）
      console.log('[START DATE] → 入力可能')
      return {
        isAvailable: true,
        startDate: data.value,
        message: ''
      }
    } else {
      // 入力開始日前（利用不可）
      const formattedDate = startDate.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'numeric', 
        day: 'numeric'
      })
      
      console.log('[START DATE] → 入力開始前、制限中')
      console.log('[START DATE] 表示メッセージ:', `このセクションは ${formattedDate} から入力可能になります。`)
      
      return {
        isAvailable: false,
        startDate: data.value,
        message: `このセクションは ${formattedDate} から入力可能になります。`
      }
    }
  } catch (error) {
    console.error('[START DATE] 入力開始日チェックエラー:', error)
    return {
      isAvailable: true,
      startDate: null,
      message: 'エラーが発生しました。管理者にお問い合わせください。'
    }
  }
}

/**
 * セクションが入力開始日制御の対象かどうかを判定
 */
export function isAdvancedSection(section: string): section is AdvancedSection {
  return advancedSections.includes(section as AdvancedSection)
}