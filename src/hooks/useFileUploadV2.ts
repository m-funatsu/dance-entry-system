'use client'

import { useState, useCallback } from 'react'
import { 
  uploadFile, 
  deleteFile, 
  validateFile, 
  generateFilePath,
  FileCategory,
  FileUploadConfig,
  UploadFileResult
} from '@/lib/file-upload'
import { useErrorHandler } from './useErrorHandler'

export interface UseFileUploadOptions {
  category?: FileCategory
  config?: FileUploadConfig
  generatePath?: (fileName: string, fileInfo?: { userId?: string; entryId?: string; field?: string }) => string
  onSuccess?: (result: UploadFileResult & { field?: string; originalFileName?: string }) => void
  onError?: (error: string) => void
}

export interface UseFileUploadReturn {
  // アップロード関数
  upload: (file: File, options?: UploadOptions) => Promise<UploadFileResult>
  uploadImage: (file: File, options?: UploadOptions) => Promise<UploadFileResult>
  uploadVideo: (file: File, options?: UploadOptions) => Promise<UploadFileResult>
  uploadAudio: (file: File, options?: UploadOptions) => Promise<UploadFileResult>
  
  // 削除関数
  deleteFile: (path: string) => Promise<boolean>
  
  // バリデーション
  validateFile: (file: File, category?: FileCategory) => { valid: boolean; error?: string }
  
  // 状態
  uploading: boolean
  progress: number
  error: string | null
  
  // ヘルパー
  reset: () => void
}

interface UploadOptions {
  userId?: string
  entryId?: string
  field?: string
  folder?: string
  path?: string
}

export function useFileUploadV2({
  category,
  config = {},
  generatePath,
  onSuccess,
  onError
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const { handleError } = useErrorHandler()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // パス生成関数
  const createPath = useCallback((fileName: string, options?: UploadOptions): string => {
    if (options?.path) return options.path
    
    if (generatePath) {
      return generatePath(fileName, {
        userId: options?.userId,
        entryId: options?.entryId,
        field: options?.field
      })
    }
    
    return generateFilePath(fileName, {
      userId: options?.userId,
      entryId: options?.entryId,
      folder: options?.folder || options?.field,
      timestamp: true,
      sanitize: true
    })
  }, [generatePath])

  // 汎用アップロード関数
  const upload = useCallback(async (
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadFileResult> => {
    setUploading(true)
    setError(null)
    setProgress(0)
    
    try {
      // バリデーション
      const validation = validateFile(file, { ...config, category })
      if (!validation.valid) {
        const errorMessage = validation.error || 'ファイルが無効です'
        setError(errorMessage)
        if (onError) onError(errorMessage)
        return { success: false, error: errorMessage }
      }
      
      // パス生成
      const path = createPath(file.name, options)
      
      // アップロード実行
      const result = await uploadFile({
        file,
        path,
        config: { ...config, category },
        onProgress: setProgress
      })
      
      if (!result.success) {
        const errorMessage = result.error || 'アップロードに失敗しました'
        setError(errorMessage)
        handleError(new Error(errorMessage))
        if (onError) onError(errorMessage)
        return result
      }
      
      // 成功時の処理
      if (onSuccess) {
        onSuccess({ ...result, field: options.field, originalFileName: file.name })
      }
      
      return result
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'アップロードエラーが発生しました'
      setError(errorMessage)
      handleError(err)
      if (onError) onError(errorMessage)
      
      return { success: false, error: errorMessage }
      
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [category, config, createPath, handleError, onError, onSuccess])

  // カテゴリー別アップロード関数
  const uploadImage = useCallback((file: File, options?: UploadOptions) => {
    return upload(file, { ...options, folder: options?.folder || 'images' })
  }, [upload])

  const uploadVideo = useCallback((file: File, options?: UploadOptions) => {
    return upload(file, { ...options, folder: options?.folder || 'videos' })
  }, [upload])

  const uploadAudio = useCallback((file: File, options?: UploadOptions) => {
    return upload(file, { ...options, folder: options?.folder || 'audio' })
  }, [upload])

  // ファイル削除
  const deleteFileHandler = useCallback(async (path: string): Promise<boolean> => {
    try {
      const result = await deleteFile(path)
      if (!result.success && result.error) {
        handleError(new Error(result.error))
      }
      return result.success
    } catch (err) {
      handleError(err)
      return false
    }
  }, [handleError])

  // バリデーション
  const validateFileHandler = useCallback((file: File, fileCategory?: FileCategory) => {
    const result = validateFile(file, { 
      ...config, 
      category: fileCategory || category 
    })
    return {
      valid: result.valid,
      error: result.error
    }
  }, [category, config])

  // リセット
  const reset = useCallback(() => {
    setUploading(false)
    setProgress(0)
    setError(null)
  }, [])

  return {
    upload,
    uploadImage,
    uploadVideo,
    uploadAudio,
    deleteFile: deleteFileHandler,
    validateFile: validateFileHandler,
    uploading,
    progress,
    error,
    reset
  }
}