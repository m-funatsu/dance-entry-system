// 期限設定をハードコードで管理
// 将来的にデータベースから取得できるようになったら移行する

export type DeadlineKey = 
  | 'basic_info_deadline'
  | 'music_info_deadline'
  | 'consent_form_deadline'
  | 'program_info_deadline'
  | 'preliminary_deadline'
  | 'semifinals_deadline'
  | 'finals_deadline'
  | 'sns_deadline'
  | 'optional_request_deadline'

export const deadlineConfig: Record<DeadlineKey, string> = {
  basic_info_deadline: '2025年3月31日 23:59',
  music_info_deadline: '2025年3月31日 23:59',
  consent_form_deadline: '2025年3月31日 23:59',
  program_info_deadline: '2025年3月31日 23:59',
  preliminary_deadline: '2025年3月31日 23:59',
  semifinals_deadline: '2025年4月30日 23:59',
  finals_deadline: '2025年5月31日 23:59',
  sns_deadline: '2025年3月31日 23:59',
  optional_request_deadline: '2025年3月31日 23:59'
}

export function getDeadlineFromConfig(key: DeadlineKey): string {
  return deadlineConfig[key] || '期限未設定'
}