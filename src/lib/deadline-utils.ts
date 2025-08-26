import { createClient } from '@/lib/supabase/client'

export type DeadlineKey = 
  | 'basic_info_deadline'
  | 'music_info_deadline'
  | 'consent_form_deadline'
  | 'program_info_deadline'
  | 'semifinals_deadline'
  | 'finals_deadline'
  | 'sns_deadline'
  | 'optional_request_deadline'

const deadlineLabels: Record<DeadlineKey, string> = {
  basic_info_deadline: '基本情報',
  music_info_deadline: '予選情報',
  consent_form_deadline: '参加同意書',
  program_info_deadline: 'プログラム掲載用情報',
  semifinals_deadline: '準決勝情報',
  finals_deadline: '決勝情報',
  sns_deadline: 'SNS情報',
  optional_request_deadline: '各種申請'
}

export async function getDeadline(key: DeadlineKey): Promise<string | null> {
  const supabase = createClient()
  
  // settingsテーブルから期限を取得
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error || !data?.value) {
    return null
  }

  // ISO 8601形式の日付を日本時間で日本語形式に変換
  try {
    console.log(`[DEADLINE DEBUG] 入力データ: ${data.value}`)
    console.log(`[DEADLINE DEBUG] キー: ${key}`)
    
    const date = new Date(data.value)
    console.log(`[DEADLINE DEBUG] 元のDate: ${date.toString()}`)
    console.log(`[DEADLINE DEBUG] UTC文字列: ${date.toUTCString()}`)
    console.log(`[DEADLINE DEBUG] ISO文字列: ${date.toISOString()}`)
    
    // 日本時間で表示するためにtoLocaleString()を使用
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    
    const japanTime = date.toLocaleString('ja-JP', options)
    console.log(`[DEADLINE DEBUG] 日本時間変換結果: ${japanTime}`)
    
    // "2025/11/14 23:59" の形式から "2025年11月14日 23:59" の形式に変換
    const match = japanTime.match(/(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{2}):(\d{2})/)
    if (match) {
      const [, year, month, day, hours, minutes] = match
      const result = `${year}年${month}月${day}日 ${hours}:${minutes}`
      console.log(`[DEADLINE DEBUG] 最終結果: ${result}`)
      return result
    }
    
    console.log(`[DEADLINE DEBUG] 正規表現マッチ失敗、そのまま返す: ${japanTime}`)
    return japanTime
  } catch (error) {
    console.error(`[DEADLINE DEBUG] エラー:`, error)
    return data.value // 変換できない場合はそのまま返す
  }
}

export function getDeadlineLabel(key: DeadlineKey): string {
  return deadlineLabels[key] || key
}