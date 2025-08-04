export enum ErrorType {
  // ネットワーク関連
  NETWORK = 'NETWORK',
  API = 'API',
  
  // 認証関連
  AUTH = 'AUTH',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // バリデーション関連
  VALIDATION = 'VALIDATION',
  FORM_VALIDATION = 'FORM_VALIDATION',
  
  // ファイル関連
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_SIZE = 'FILE_SIZE',
  FILE_TYPE = 'FILE_TYPE',
  
  // データベース関連
  DATABASE = 'DATABASE',
  SUPABASE = 'SUPABASE',
  
  // アプリケーション関連
  APPLICATION = 'APPLICATION',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details?: string
  timestamp: Date
  context?: Record<string, unknown>
  stack?: string
  code?: string
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  logToConsole?: boolean
  logToServer?: boolean
  fallbackMessage?: string
}

export interface ErrorLogger {
  log: (error: AppError) => void
  logBatch: (errors: AppError[]) => void
}