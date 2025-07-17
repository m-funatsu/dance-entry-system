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
  team_name?: string
  participant_names: string
  representative_name?: string
  representative_furigana?: string
  partner_name?: string
  partner_furigana?: string
  phone_number?: string
  emergency_contact?: string
  photo_url?: string
  music_title?: string
  choreographer?: string
  choreographer_furigana?: string
  story?: string
  agreement_checked?: boolean
  google_form_data?: Record<string, unknown>
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