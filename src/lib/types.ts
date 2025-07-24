export interface User {
  id: string
  email: string
  name: string
  role: 'participant' | 'admin'
  has_seed?: boolean
  created_at: string
  updated_at: string
}

export interface Entry {
  id: string
  user_id: string
  dance_style: string
  participant_names: string
  representative_name?: string
  representative_furigana?: string
  representative_email?: string
  partner_name?: string
  partner_furigana?: string
  phone_number?: string
  photo_url?: string
  music_title?: string
  original_artist?: string
  final_music_title?: string
  final_original_artist?: string
  use_different_songs?: boolean
  choreographer?: string
  choreographer_furigana?: string
  story?: string
  work_title?: string
  sponsor?: string
  remarks?: string
  optional_requests?: string
  agreement_checked?: boolean
  privacy_policy_checked?: boolean
  google_form_data?: Record<string, unknown>
  // SNS情報
  instagram?: string
  twitter?: string
  facebook?: string
  // 音響指示書
  sound_semifinal?: string
  sound_final?: string
  // 照明指示書
  lighting_semifinal?: string
  lighting_final?: string
  // 参加同意書
  consent_form_submitted?: boolean
  consent_form_submitted_at?: string
  // プログラム掲載用情報
  program_info_submitted?: boolean
  program_title?: string
  program_subtitle?: string
  program_description?: string
  program_duration?: string
  program_music_info?: string
  program_choreographer_info?: string
  program_special_notes?: string
  status: 'pending' | 'submitted' | 'selected' | 'rejected'
  created_at: string
  updated_at: string
}

export interface EntryFile {
  id: string
  entry_id: string
  file_type: 'music' | 'audio' | 'photo' | 'video'
  file_name: string
  file_path: string
  file_size?: number
  mime_type?: string
  purpose?: string
  uploaded_at: string
}

export interface Selection {
  id: string
  entry_id: string
  admin_id: string
  score?: number
  comments?: string
  status: 'pending' | 'selected' | 'rejected'
  created_at: string
  updated_at: string
}

export interface Settings {
  id: string
  key: string
  value: string
  description?: string
  created_at: string
  updated_at: string
}

export interface BasicInfo {
  id: string
  entry_id: string
  dance_style: string
  representative_name: string
  representative_furigana: string
  representative_email: string
  partner_name?: string
  partner_furigana?: string
  phone_number: string
  choreographer?: string
  choreographer_furigana?: string
  agreement_checked: boolean
  privacy_policy_checked: boolean
  created_by?: string
  created_at: string
  updated_by?: string
  updated_at: string
}

export interface NotificationTemplate {
  id: string
  name: string
  description?: string
  subject: string
  body: string
  category: 'entry' | 'selection' | 'reminder' | 'general'
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      entries: {
        Row: Entry
        Insert: Omit<Entry, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Entry, 'id' | 'created_at' | 'updated_at'>>
      }
      basic_info: {
        Row: BasicInfo
        Insert: Omit<BasicInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
        Update: Partial<Omit<BasicInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
      }
      entry_files: {
        Row: EntryFile
        Insert: Omit<EntryFile, 'id' | 'uploaded_at'>
        Update: Partial<Omit<EntryFile, 'id' | 'uploaded_at'>>
      }
      selections: {
        Row: Selection
        Insert: Omit<Selection, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Selection, 'id' | 'created_at' | 'updated_at'>>
      }
      settings: {
        Row: Settings
        Insert: Omit<Settings, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Settings, 'id' | 'created_at' | 'updated_at'>>
      }
      notification_templates: {
        Row: NotificationTemplate
        Insert: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}