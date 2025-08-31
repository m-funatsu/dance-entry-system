'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface UploadStatus {
  isUploading: boolean
  progress: number
  fileName?: string
  fileSize?: number
  fileType?: 'video' | 'audio' | 'photo' | 'music' | 'document'
  error?: string | null
  uploadId?: string
}

export interface UseUploadStatusReturn {
  status: UploadStatus
  startUpload: (file: File, fileType?: string) => string // アップロードIDを返す
  updateProgress: (uploadId: string, progress: number) => void
  completeUpload: (uploadId: string) => void
  failUpload: (uploadId: string, error: string) => void
  clearStatus: () => void
  retryUpload?: () => void
}

export const useUploadStatus = (
  onRetry?: () => void
): UseUploadStatusReturn => {
  const [status, setStatus] = useState<UploadStatus>({
    isUploading: false,
    progress: 0,
    error: null
  })
  
  const currentUploadId = useRef<string | null>(null)
  const retryCallback = useRef<(() => void) | undefined>(onRetry)
  
  // onRetryの更新を追跡
  useEffect(() => {
    retryCallback.current = onRetry
  }, [onRetry])

  const generateUploadId = useCallback(() => {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const getFileType = useCallback((file: File, customType?: string): 'video' | 'audio' | 'photo' | 'music' | 'document' => {
    if (customType) {
      if (['video', 'audio', 'photo', 'music', 'document'].includes(customType)) {
        return customType as 'video' | 'audio' | 'photo' | 'music' | 'document'
      }
    }
    
    const type = file.type.toLowerCase()
    if (type.startsWith('video/')) return 'video'
    if (type.startsWith('audio/') || type.includes('mp3') || type.includes('wav')) {
      // 楽曲かオーディオかの判定（ファイル名や用途で判断）
      const fileName = file.name.toLowerCase()
      if (fileName.includes('music') || fileName.includes('song') || fileName.includes('bgm')) {
        return 'music'
      }
      return 'audio'
    }
    if (type.startsWith('image/')) return 'photo'
    return 'document'
  }, [])

  const startUpload = useCallback((file: File, customFileType?: string): string => {
    const uploadId = generateUploadId()
    currentUploadId.current = uploadId
    
    const fileType = getFileType(file, customFileType)
    
    setStatus({
      isUploading: true,
      progress: 0,
      fileName: file.name,
      fileSize: file.size,
      fileType,
      error: null,
      uploadId
    })
    
    return uploadId
  }, [generateUploadId, getFileType])

  const updateProgress = useCallback((uploadId: string, progress: number) => {
    // 現在のアップロードIDと一致する場合のみ更新
    if (currentUploadId.current === uploadId) {
      setStatus(prev => ({
        ...prev,
        progress: Math.max(0, Math.min(100, progress))
      }))
    }
  }, [])

  const completeUpload = useCallback((uploadId: string) => {
    if (currentUploadId.current === uploadId) {
      setStatus(prev => ({
        ...prev,
        isUploading: false,
        progress: 100,
        error: null
      }))
      
      // 3秒後にステータスをクリア
      setTimeout(() => {
        if (currentUploadId.current === uploadId) {
          setStatus({
            isUploading: false,
            progress: 0,
            error: null
          })
          currentUploadId.current = null
        }
      }, 3000)
    }
  }, [])

  const failUpload = useCallback((uploadId: string, error: string) => {
    if (currentUploadId.current === uploadId) {
      setStatus(prev => ({
        ...prev,
        isUploading: false,
        error
      }))
    }
  }, [])

  const clearStatus = useCallback(() => {
    setStatus({
      isUploading: false,
      progress: 0,
      error: null
    })
    currentUploadId.current = null
  }, [])

  const handleRetry = useCallback(() => {
    if (retryCallback.current) {
      clearStatus()
      retryCallback.current()
    }
  }, [clearStatus])

  return {
    status,
    startUpload,
    updateProgress,
    completeUpload,
    failUpload,
    clearStatus,
    retryUpload: onRetry ? handleRetry : undefined
  }
}