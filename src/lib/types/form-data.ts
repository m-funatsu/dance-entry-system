// フォームデータの具体的な型定義

// 基本的なフォームデータ
export interface BaseFormData {
  id?: string
  created_at?: string
  updated_at?: string
  [key: string]: string | boolean | number | undefined | null | BaseFormData | Array<unknown> | Record<string, unknown> // 動的プロパティアクセスを許可
}

// エントリーフォームデータ
export interface EntryFormData extends BaseFormData {
  user_id: string
  entry_id?: string
  dance_style?: string
  team_name?: string
  participant_names?: string
  status?: 'pending' | 'submitted' | 'selected' | 'rejected'
}

// 基本情報フォームデータ
export interface BasicInfoFormData extends BaseFormData {
  entry_id?: string
  dance_style: string
  category_division: string
  representative_name: string
  representative_furigana: string
  representative_romaji?: string
  representative_birthdate?: string
  representative_email: string
  partner_name?: string
  partner_furigana?: string
  partner_romaji?: string
  partner_birthdate?: string
  phone_number: string
  real_name?: string
  real_name_kana?: string
  partner_real_name?: string
  partner_real_name_kana?: string
  emergency_contact_name_1?: string
  emergency_contact_phone_1?: string
  emergency_contact_name_2?: string
  emergency_contact_phone_2?: string
  guardian_name?: string
  guardian_phone?: string
  guardian_email?: string
  partner_guardian_name?: string
  partner_guardian_phone?: string
  partner_guardian_email?: string
  agreement_checked: boolean
  media_consent_checked: boolean
  privacy_policy_checked: boolean
}

// 予選フォームデータ
export interface PreliminaryFormData extends BaseFormData {
  entry_id: string
  user_id: string
  video_url?: string
  video_file?: {
    id: string
    file_path: string
    file_name: string
  }
  agreement_preliminary: boolean
}

// 予選音楽情報フォームデータ
export interface PreliminaryMusicFormData extends BaseFormData {
  entry_id: string
  video_submitted: boolean
  work_title: string
  work_story: string
  music_rights_cleared: string
  music_title: string
  cd_title: string
  artist: string
  record_number: string
  jasrac_code: string
  music_type: string
}

// 準決勝フォームデータ
export interface SemifinalsFormData extends BaseFormData {
  entry_id: string
  user_id: string
  music_url?: string
  music_file?: {
    id: string
    file_path: string
    file_name: string
  }
  photo_url?: string
  photo_file?: {
    id: string
    file_path: string
    file_name: string
  }
  is_submitted: boolean
}

// 決勝フォームデータ
export interface FinalsFormData extends BaseFormData {
  entry_id: string
  choreographer_name?: string
  choreographer_name_kana?: string
  music_title?: string
  music_artist?: string
  music_time?: string
  formation_description?: string
  costume_description?: string
  comment?: string
  program_order?: number
}

// SNSフォームデータ
export interface SnsFormData extends BaseFormData {
  entry_id: string
  instagram_id?: string
  tiktok_id?: string
  practice_video_path?: string
  practice_video_filename?: string
  introduction_highlight_path?: string
  introduction_highlight_filename?: string
  sns_notes?: string
}

// チームメンバーフォームデータ
export interface TeamMemberFormData extends BaseFormData {
  entry_id: string
  member_name: string
  member_name_kana: string
  member_birth_date: string
  member_email: string
  member_phone: string
}

// 統合エントリーフォームデータ
export interface IntegratedEntryFormData extends BaseFormData {
  // 基本情報
  dance_style?: string
  team_name?: string
  participant_names?: string
  representative_name?: string
  representative_name_kana?: string
  representative_phone?: string
  representative_birthdate?: string
  agreement_terms?: boolean
  
  // ファイル情報
  photo_url?: string
  video_url?: string
  music_url?: string
  
  // 追加情報
  choreographer_name?: string
  choreographer_name_kana?: string
  story?: string
  
  // ステータス
  current_section?: string
  sections_saved?: {
    basic?: boolean
    music?: boolean
    additional?: boolean
    optional?: boolean
  }
}

// メールテンプレートデータ
export interface EmailTemplateData extends BaseFormData {
  name: string
  email: string
  entryNumber?: string
  entryId?: string
  teamName?: string
  danceStyle?: string
  selectionStatus?: string
  deadline?: string
  additionalInfo?: string
  result?: string
  message?: string
  itemName?: string
  [key: string]: string | boolean | number | undefined | null | EmailTemplateData | Array<unknown> | Record<string, unknown> // 追加の動的プロパティを許可
}

// CSVエクスポートデータ
export interface CsvExportData {
  entry_number: string
  team_name: string
  dance_style: string
  representative_name: string
  status: string
  created_at: string
  email?: string
  phone?: string
}