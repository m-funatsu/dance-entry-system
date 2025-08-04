// API-related types

// Email types
export interface EmailRequest {
  to: string[]
  subject: string
  body: string
  templateId?: string
  variables?: Record<string, string>
}

export interface EmailResponse {
  success: boolean
  sentCount: number
  failedCount: number
  errors?: string[]
}

// CSV export types
export interface CsvExportOptions {
  fields: string[]
  includeHeaders?: boolean
  delimiter?: string
  quote?: string
}

// File upload types
export interface UploadOptions {
  maxSizeMB?: number
  allowedTypes?: string[]
  generateThumbnail?: boolean
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

// Admin action types
export interface BulkUpdateRequest {
  ids: string[]
  updates: Record<string, unknown>
}

export interface BulkDeleteRequest {
  ids: string[]
  soft?: boolean
}

// Settings update types
export interface SettingUpdate {
  key: string
  value: string
  description?: string
}

// Background settings types
export interface BackgroundSettings {
  enabled: boolean
  images: BackgroundImage[]
}

export interface BackgroundImage {
  id: string
  url: string
  name: string
  isActive: boolean
  order: number
  uploadedAt: string
}

// Deadline settings types
export interface DeadlineSettings {
  [key: string]: {
    enabled: boolean
    deadline: string
    message?: string
  }
}

// Statistics types
export interface DashboardStats {
  totalEntries: number
  pendingEntries: number
  submittedEntries: number
  selectedEntries: number
  rejectedEntries: number
  totalUsers: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'entry_created' | 'entry_updated' | 'file_uploaded' | 'status_changed'
  userId: string
  userName: string
  timestamp: string
  details: Record<string, unknown>
}

// Search types
export interface SearchParams {
  query: string
  fields?: string[]
  fuzzy?: boolean
  limit?: number
  offset?: number
}

export interface SearchResult<T> {
  items: T[]
  total: number
  highlights?: Record<string, string[]>
}