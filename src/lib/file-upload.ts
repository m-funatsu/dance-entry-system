import { createClient } from '@/lib/supabase/client'
import { ErrorType } from '@/lib/types'

// ファイルタイプの定義
export type FileCategory = 'image' | 'video' | 'audio' | 'document'
export type FileType = 'music' | 'audio' | 'photo' | 'video' | 'pdf' | 'doc'

// ファイルアップロード設定
export interface FileUploadConfig {
  maxSize?: number // バイト単位
  allowedTypes?: string[] // MIMEタイプ
  category?: FileCategory
  sanitizeFileName?: boolean
  generatePath?: (fileName: string) => string
}

// デフォルト設定
export const FILE_UPLOAD_DEFAULTS = {
  bucket: 'files',
  maxSizes: {
    image: 100 * 1024 * 1024, // 100MB
    video: 200 * 1024 * 1024, // 200MB
    audio: 100 * 1024 * 1024, // 100MB
    document: 50 * 1024 * 1024, // 50MB
  },
  allowedTypes: {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime', 'video/webm'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/mp3', 'audio/ogg'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  // 現在のSupabase無料枠の制限
  currentLimits: {
    image: 25 * 1024 * 1024, // 25MB
    video: 50 * 1024 * 1024, // 50MB
    audio: 25 * 1024 * 1024, // 25MB
    document: 25 * 1024 * 1024, // 25MB
  }
} as const

// ファイル名のサニタイズ
export function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.')
  const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : ''
  
  // 日本語や特殊文字を削除し、英数字とハイフン、アンダースコアのみ残す
  const sanitizedName = nameWithoutExt
    .replace(/[^\w\-]/g, '_')  // 英数字、アンダースコア、ハイフン以外を_に置換
    .replace(/_{2,}/g, '_')    // 連続するアンダースコアを1つに
    .replace(/^_+|_+$/g, '')   // 先頭と末尾のアンダースコアを削除
  
  return sanitizedName + extension
}

// ファイルカテゴリーを判定
export function getFileCategory(mimeType: string): FileCategory | null {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('application/')) return 'document'
  return null
}

// ファイルサイズのフォーマット
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ファイルバリデーション
export interface FileValidationResult {
  valid: boolean
  error?: string
  errorType?: ErrorType
}

export function validateFile(
  file: File,
  config: FileUploadConfig = {}
): FileValidationResult {
  // ファイルが存在しない
  if (!file) {
    return {
      valid: false,
      error: 'ファイルが選択されていません',
      errorType: ErrorType.VALIDATION
    }
  }

  const category = config.category || getFileCategory(file.type)
  if (!category) {
    return {
      valid: false,
      error: 'サポートされていないファイル形式です',
      errorType: ErrorType.FILE_TYPE
    }
  }

  // ファイルサイズチェック
  const maxSize = config.maxSize || FILE_UPLOAD_DEFAULTS.currentLimits[category as keyof typeof FILE_UPLOAD_DEFAULTS.currentLimits]
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `ファイルサイズが${formatFileSize(maxSize)}を超えています`,
      errorType: ErrorType.FILE_SIZE
    }
  }

  // ファイルタイプチェック
  const categoryAllowedTypes = FILE_UPLOAD_DEFAULTS.allowedTypes[category as keyof typeof FILE_UPLOAD_DEFAULTS.allowedTypes]
  const allowedTypes = config.allowedTypes || (categoryAllowedTypes ? [...categoryAllowedTypes] : [])
  if (!allowedTypes || !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: '許可されていないファイル形式です',
      errorType: ErrorType.FILE_TYPE
    }
  }

  return { valid: true }
}

// ファイルパス生成
export function generateFilePath(
  fileName: string,
  options: {
    userId?: string
    entryId?: string
    folder?: string
    timestamp?: boolean
    sanitize?: boolean
  } = {}
): string {
  const parts: string[] = []
  
  if (options.userId) parts.push(options.userId)
  if (options.entryId) parts.push(options.entryId)
  if (options.folder) parts.push(options.folder)
  
  let finalFileName = fileName
  
  if (options.sanitize !== false) {
    finalFileName = sanitizeFileName(fileName)
  }
  
  if (options.timestamp !== false) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    finalFileName = `${timestamp}-${finalFileName}`
  }
  
  parts.push(finalFileName)
  
  return parts.join('/')
}

// 統一ファイルアップロード関数
export interface UploadFileOptions {
  file: File
  path?: string
  config?: FileUploadConfig
  bucketName?: string
  onProgress?: (progress: number) => void
}

export interface UploadFileResult {
  success: boolean
  url?: string
  path?: string
  error?: string
  errorType?: ErrorType
}

export async function uploadFile({
  file,
  path,
  config = {},
  bucketName = FILE_UPLOAD_DEFAULTS.bucket,
  onProgress // eslint-disable-line @typescript-eslint/no-unused-vars
}: UploadFileOptions): Promise<UploadFileResult> {
  const supabase = createClient()
  
  // ファイルバリデーション
  const validation = validateFile(file, config)
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      errorType: validation.errorType
    }
  }
  
  // パスが指定されていない場合は生成
  const filePath = path || (config.generatePath ? config.generatePath(file.name) : file.name)
  
  try {
    // アップロード実行
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      // エラータイプの判定
      let errorType = ErrorType.FILE_UPLOAD
      let errorMessage = 'ファイルのアップロードに失敗しました'
      
      if (error.message?.includes('too large') || error.message?.includes('413')) {
        errorType = ErrorType.FILE_SIZE
        errorMessage = 'ファイルサイズが大きすぎます'
      } else if (error.message?.includes('InvalidKey')) {
        errorType = ErrorType.FILE_TYPE
        errorMessage = 'ファイル名に使用できない文字が含まれています'
      } else if (error.message?.includes('404')) {
        errorType = ErrorType.DATABASE
        errorMessage = 'ストレージの設定に問題があります'
      }
      
      return {
        success: false,
        error: `${errorMessage}: ${error.message}`,
        errorType
      }
    }
    
    // パブリックURLを取得
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)
    
    return {
      success: true,
      url: publicUrl,
      path: data.path
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'アップロードに失敗しました',
      errorType: ErrorType.FILE_UPLOAD
    }
  }
}

// ファイル削除
export async function deleteFile(
  path: string,
  bucketName: string = FILE_UPLOAD_DEFAULTS.bucket
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path])
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ファイルの削除に失敗しました'
    }
  }
}

// 署名付きURLの取得
export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600,
  bucketName: string = FILE_UPLOAD_DEFAULTS.bucket
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn)
    
    if (error) {
      return { error: error.message }
    }
    
    return { url: data.signedUrl }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'URLの取得に失敗しました'
    }
  }
}