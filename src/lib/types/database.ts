// Database table types
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
  category_division: string
  representative_name: string
  representative_furigana: string
  representative_email: string
  partner_name?: string
  partner_furigana?: string
  phone_number: string
  choreographer?: string
  choreographer_furigana?: string
  agreement_checked: boolean
  media_consent_checked: boolean
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

export interface PreliminaryInfo {
  id: string
  entry_id: string
  work_title: string
  work_story?: string
  video_submitted: boolean
  music_rights_cleared: string
  music_title: string
  cd_title?: string
  artist: string
  record_number?: string
  jasrac_code?: string
  music_type?: string
  created_by?: string
  created_at: string
  updated_by?: string
  updated_at: string
}

export interface ProgramInfo {
  id: string
  entry_id: string
  song_count: '1曲' | '2曲'
  player_photo_type?: string
  affiliation?: string
  player_photo_path?: string
  notes?: string
  semifinal_story?: string
  semifinal_highlight?: string
  semifinal_image1_path?: string
  semifinal_image2_path?: string
  semifinal_image3_path?: string
  semifinal_image4_path?: string
  final_affiliation?: string
  final_player_photo_path?: string
  final_story?: string
  final_highlight?: string
  final_image1_path?: string
  final_image2_path?: string
  final_image3_path?: string
  final_image4_path?: string
  created_at: string
  updated_at: string
}

export interface SemifinalsInfo {
  id: string
  entry_id: string
  music_change_from_preliminary?: boolean
  work_title?: string
  work_character_story?: string
  copyright_permission?: string
  music_title?: string
  cd_title?: string
  artist?: string
  record_number?: string
  jasrac_code?: string
  music_type?: string
  music_data_path?: string
  music_usage_method?: string
  sound_start_timing?: string
  chaser_song_designation?: string
  chaser_song?: string
  fade_out_start_time?: string
  fade_out_complete_time?: string
  dance_start_timing?: string
  scene1_time?: string
  scene1_trigger?: string
  scene1_color_type?: string
  scene1_color_other?: string
  scene1_image?: string
  scene1_image_path?: string
  scene1_notes?: string
  scene2_time?: string
  scene2_trigger?: string
  scene2_color_type?: string
  scene2_color_other?: string
  scene2_image?: string
  scene2_image_path?: string
  scene2_notes?: string
  scene3_time?: string
  scene3_trigger?: string
  scene3_color_type?: string
  scene3_color_other?: string
  scene3_image?: string
  scene3_image_path?: string
  scene3_notes?: string
  scene4_time?: string
  scene4_trigger?: string
  scene4_color_type?: string
  scene4_color_other?: string
  scene4_image?: string
  scene4_image_path?: string
  scene4_notes?: string
  scene5_time?: string
  scene5_trigger?: string
  scene5_color_type?: string
  scene5_color_other?: string
  scene5_image?: string
  scene5_image_path?: string
  scene5_notes?: string
  chaser_exit_time?: string
  chaser_exit_trigger?: string
  chaser_exit_color_type?: string
  chaser_exit_color_other?: string
  chaser_exit_image?: string
  chaser_exit_image_path?: string
  chaser_exit_notes?: string
  choreographer_change_from_preliminary?: boolean
  choreographer_name?: string
  choreographer_name_kana?: string
  bank_name?: string
  branch_name?: string
  account_type?: string
  account_number?: string
  account_holder?: string
  created_at: string
  created_by?: string
  updated_at: string
  updated_by?: string
}

export interface FinalsInfo {
  id: string
  entry_id: string
  music_change?: boolean
  copy_preliminary_music?: boolean
  work_title?: string
  work_character_story?: string
  copyright_permission?: string
  music_title?: string
  cd_title?: string
  artist?: string
  record_number?: string
  jasrac_code?: string
  music_type?: string
  music_data_path?: string
  music_usage_method?: string
  sound_change_from_semifinals?: boolean
  sound_start_timing?: string
  chaser_song_designation?: string
  chaser_song?: string
  fade_out_start_time?: string
  fade_out_complete_time?: string
  lighting_change_from_semifinals?: boolean
  dance_start_timing?: string
  scene1_time?: string
  scene1_trigger?: string
  scene1_color_type?: string
  scene1_color_other?: string
  scene1_image?: string
  scene1_image_path?: string
  scene1_notes?: string
  scene2_time?: string
  scene2_trigger?: string
  scene2_color_type?: string
  scene2_color_other?: string
  scene2_image?: string
  scene2_image_path?: string
  scene2_notes?: string
  scene3_time?: string
  scene3_trigger?: string
  scene3_color_type?: string
  scene3_color_other?: string
  scene3_image?: string
  scene3_image_path?: string
  scene3_notes?: string
  scene4_time?: string
  scene4_trigger?: string
  scene4_color_type?: string
  scene4_color_other?: string
  scene4_image?: string
  scene4_image_path?: string
  scene4_notes?: string
  scene5_time?: string
  scene5_trigger?: string
  scene5_color_type?: string
  scene5_color_other?: string
  scene5_image?: string
  scene5_image_path?: string
  scene5_notes?: string
  chaser_exit_time?: string
  chaser_exit_trigger?: string
  chaser_exit_color_type?: string
  chaser_exit_color_other?: string
  chaser_exit_image?: string
  chaser_exit_image_path?: string
  chaser_exit_notes?: string
  choreographer_change?: boolean
  choreographer_name?: string
  choreographer_name_kana?: string
  choreographer2_name?: string
  choreographer2_name_kana?: string
  choreographer_attendance?: string
  choreographer_photo_permission?: string
  choreographer_photo_path?: string
  created_at: string
  created_by?: string
  updated_at: string
  updated_by?: string
}

export interface ApplicationsInfo {
  id: string
  entry_id: string
  related_ticket_count?: number
  related1_relationship?: string
  related1_name?: string
  related1_furigana?: string
  related2_relationship?: string
  related2_name?: string
  related2_furigana?: string
  related3_relationship?: string
  related3_name?: string
  related3_furigana?: string
  related4_relationship?: string
  related4_name?: string
  related4_furigana?: string
  related5_relationship?: string
  related5_name?: string
  related5_furigana?: string
  related_ticket_total_amount?: number
  companion1_name?: string
  companion1_furigana?: string
  companion1_purpose?: string
  companion2_name?: string
  companion2_furigana?: string
  companion2_purpose?: string
  companion3_name?: string
  companion3_furigana?: string
  companion3_purpose?: string
  companion_total_amount?: number
  payment_slip_path?: string
  applications_notes?: string
  makeup_preferred_stylist?: string
  makeup_name?: string
  makeup_email?: string
  makeup_phone?: string
  makeup_notes?: string
  makeup_style1?: string
  makeup_style2?: string
  created_at: string
  created_by?: string
  updated_at: string
  updated_by?: string
}

export interface SnsInfo {
  id: string
  entry_id: string
  practice_video_path?: string
  practice_video_filename?: string
  introduction_highlight_path?: string
  introduction_highlight_filename?: string
  sns_notes?: string
  created_at: string
  created_by?: string
  updated_at: string
  updated_by?: string
}

// Supabase Database Types
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
      preliminary_info: {
        Row: PreliminaryInfo
        Insert: Omit<PreliminaryInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
        Update: Partial<Omit<PreliminaryInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
      }
      program_info: {
        Row: ProgramInfo
        Insert: Omit<ProgramInfo, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProgramInfo, 'id' | 'created_at' | 'updated_at'>>
      }
      semifinals_info: {
        Row: SemifinalsInfo
        Insert: Omit<SemifinalsInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
        Update: Partial<Omit<SemifinalsInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
      }
      finals_info: {
        Row: FinalsInfo
        Insert: Omit<FinalsInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
        Update: Partial<Omit<FinalsInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
      }
      applications_info: {
        Row: ApplicationsInfo
        Insert: Omit<ApplicationsInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
        Update: Partial<Omit<ApplicationsInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
      }
      sns_info: {
        Row: SnsInfo
        Insert: Omit<SnsInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
        Update: Partial<Omit<SnsInfo, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
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