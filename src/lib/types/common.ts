// Common types used across the application

// Status types
export type EntryStatus = 'pending' | 'submitted' | 'selected' | 'rejected'
export type UserRole = 'participant' | 'admin'

// File types
export type FileType = 'music' | 'audio' | 'photo' | 'video'
export type MimeType = 'image/jpeg' | 'image/jpg' | 'image/png' | 'video/mp4' | 'video/mov' | 'video/avi' | 'video/quicktime' | 'audio/mpeg' | 'audio/wav' | 'audio/aac' | 'audio/mp3'

// Dance styles
export type DanceStyle = 'ジャズ' | 'ヒップホップ' | 'コンテンポラリー' | 'バレエ' | 'その他'

// Common form field types
export type FieldType = 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select'

// Validation types
export type ValidationRule = 'required' | 'email' | 'phone' | 'maxLength' | 'minLength' | 'pattern'

// API response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: ApiError
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
}

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Filter types
export interface FilterParams {
  search?: string
  status?: EntryStatus[]
  dateFrom?: string
  dateTo?: string
  [key: string]: unknown
}

// Date range type
export interface DateRange {
  from: Date | null
  to: Date | null
}

// Option types for select fields
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

// Color types for lighting scenes
export const COLOR_TYPES = [
  '赤系', '青系', '緑系', '黄系', '紫系', '橙系', '白系', 'その他'
] as const

export type ColorType = typeof COLOR_TYPES[number]

// Bank account types
export const ACCOUNT_TYPES = ['普通', '当座', '貯蓄'] as const
export type AccountType = typeof ACCOUNT_TYPES[number]

// Choreographer attendance options
export const ATTENDANCE_OPTIONS = [
  '振付師本人が当日会場で席について観戦する',
  '振付師本人が当日会場にいる（役員・選手等）',
  '振付師の代理人が当日会場で席について観戦する',
  '振付師の代理人が当日会場にいる（役員等）',
  '欠席する'
] as const

export type AttendanceOption = typeof ATTENDANCE_OPTIONS[number]

// Permission options
export type PermissionOption = '希望する' | '希望しない'

// Copyright permission types
export const COPYRIGHT_PERMISSIONS = [
  '著作権保護楽曲ではない',
  'オリジナル楽曲である',
  '著作権者から許諾を得ている',
  'その他'
] as const

export type CopyrightPermission = typeof COPYRIGHT_PERMISSIONS[number]

// Music usage method types
export const MUSIC_USAGE_METHODS = [
  '楽曲編集を希望する',
  '楽曲編集を希望しない'
] as const

export type MusicUsageMethod = typeof MUSIC_USAGE_METHODS[number]

// Chaser song designation types
export const CHASER_SONG_DESIGNATIONS = [
  '自作曲に組み込み',
  '必要',
  '不要（無音）'
] as const

export type ChaserSongDesignation = typeof CHASER_SONG_DESIGNATIONS[number]