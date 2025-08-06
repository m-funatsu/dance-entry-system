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
  
  // DeadlineKeyからsection_nameへのマッピング
  const sectionNameMap: Record<DeadlineKey, string> = {
    basic_info_deadline: 'basic_info',
    music_info_deadline: 'music_info',
    consent_form_deadline: 'consent_form',
    program_info_deadline: 'program_info',
    semifinals_deadline: 'semifinals',
    finals_deadline: 'finals',
    sns_deadline: 'sns',
    optional_request_deadline: 'optional_request'
  }
  
  const sectionName = sectionNameMap[key]
  console.log(`Querying deadline for section: ${sectionName}`)
  
  const { data, error } = await supabase
    .from('section_deadlines')
    .select('deadline')
    .eq('section_name', sectionName)
    .single()

  console.log(`Query result:`, { data, error })

  if (error || !data?.deadline) {
    console.log(`No deadline found for section: ${sectionName}`)
    return null
  }

  // ISO 8601形式の日付を日本語形式に変換
  try {
    const date = new Date(data.deadline)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    
    return `${year}年${month}月${day}日 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  } catch {
    return data.deadline // 変換できない場合はそのまま返す
  }
}

export function getDeadlineLabel(key: DeadlineKey): string {
  return deadlineLabels[key] || key
}