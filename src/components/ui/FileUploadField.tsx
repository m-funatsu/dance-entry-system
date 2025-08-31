'use client'

import { useState, useRef, memo, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { FileCategory, formatFileSize, validateFile } from '@/lib/file-upload'
import { useFileUploadV2 } from '@/hooks/useFileUploadV2'
import { useUploadStatus } from '@/hooks/useUploadStatus'
import { UploadStatusBar } from './UploadStatusBar'
import { trackBehaviorDifference } from '@/lib/device-detector'

export interface FileUploadFieldProps {
  label: string
  value?: string | null
  onChange: (file: File) => void
  onUploadComplete?: (url: string) => void
  onDelete?: () => void
  category?: FileCategory
  disabled?: boolean
  required?: boolean
  maxSizeMB?: number
  accept?: string
  uploadPath?: (fileName: string) => string
  helperText?: string
  placeholder?: {
    icon?: React.ReactNode
    title?: string
    subtitle?: string
    formats?: string
  }
  // 統一ステータスバー用props
  showStatusBar?: boolean
  hidePreviewUntilComplete?: boolean
}

export const FileUploadField = memo<FileUploadFieldProps>(({
  label,
  value,
  onChange,
  onUploadComplete,
  onDelete,
  category = 'document',
  disabled = false,
  required = false,
  maxSizeMB,
  accept,
  uploadPath,
  helperText,
  placeholder,
  showStatusBar = false,
  hidePreviewUntilComplete = false
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(!hidePreviewUntilComplete)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 統一ステータスバー管理（showStatusBarが有効な場合）
  const { status, startUpload, updateProgress, completeUpload, failUpload } = useUploadStatus()

  const { uploading, progress, error: uploadError, upload } = useFileUploadV2({
    category,
    config: maxSizeMB ? { maxSize: maxSizeMB * 1024 * 1024 } : undefined,
    generatePath: uploadPath,
    onSuccess: (result) => {
      if (result.url && onUploadComplete) {
        onUploadComplete(result.url)
      }
    }
  })

  const error = localError || uploadError

  const handleFile = useCallback(async (file: File) => {
    setLocalError(null)
    
    // ローカルバリデーション
    const validation = validateFile(file, {
      category,
      maxSize: maxSizeMB ? maxSizeMB * 1024 * 1024 : undefined
    })
    
    if (!validation.valid) {
      setLocalError(validation.error || 'ファイルが無効です')
      return
    }

    setSelectedFile(file)
    onChange(file)
    
    // プレビューを一時的に隠す（アップロード完了まで）
    if (hidePreviewUntilComplete) {
      setShowPreview(false)
    }
    
    // ステータスバー表示開始（showStatusBarが有効な場合）
    let uploadId: string | undefined
    if (showStatusBar) {
      uploadId = startUpload(file, category)
    }
    
    // 自動アップロード（uploadPathが提供されている場合）
    if (uploadPath && onUploadComplete) {
      try {
        await upload(file)
        if (showStatusBar && uploadId) {
          completeUpload(uploadId)
          if (hidePreviewUntilComplete) {
            setShowPreview(true)
          }
        }
      } catch (error) {
        if (showStatusBar && uploadId) {
          failUpload(uploadId, error instanceof Error ? error.message : 'アップロードに失敗しました')
        }
      }
    } else if (showStatusBar && uploadId) {
      // 仮想アップロード進行表示（実際のアップロードなし）
      let currentProgress = 0
      const interval = setInterval(() => {
        currentProgress += Math.random() * 20 + 10
        if (currentProgress >= 100) {
          currentProgress = 100
          updateProgress(uploadId!, currentProgress)
          setTimeout(() => {
            completeUpload(uploadId!)
            if (hidePreviewUntilComplete) {
              setShowPreview(true)
            }
          }, 500)
          clearInterval(interval)
        } else {
          updateProgress(uploadId!, currentProgress)
        }
      }, 150)
    }
  }, [category, maxSizeMB, onChange, uploadPath, onUploadComplete, upload, showStatusBar, hidePreviewUntilComplete, startUpload, updateProgress, completeUpload, failUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [disabled, handleFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    trackBehaviorDifference('FILE_UPLOAD', 'FILE_SELECT', file ? 'success' : 'error', {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      category: category,
      accept: accept
    })
    
    if (file) {
      handleFile(file)
    }
  }, [handleFile, category, accept])

  const getDefaultIcon = useMemo(() => {
    switch (category) {
      case 'image':
        return (
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'video':
        return (
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      case 'audio':
        return (
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        )
      default:
        return (
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )
    }
  }, [category])

  const getDefaultFormats = useMemo(() => {
    switch (category) {
      case 'image':
        return 'JPG, PNG, GIF など'
      case 'video':
        return 'MP4, MOV, AVI など'
      case 'audio':
        return 'MP3, WAV, AAC など'
      default:
        return 'すべてのファイル形式'
    }
  }, [category])

  return (
    <div className={`relative ${disabled ? 'opacity-50' : ''}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {helperText && (
        <p className="text-sm text-gray-600 mb-2">
          {helperText}
        </p>
      )}
      
      {error && (
        <div className="mb-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-indigo-50'}
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}
          ${value && !uploading ? 'bg-green-50 border-green-300' : ''}
          ${uploading ? 'bg-blue-50 border-blue-300' : ''}
          ${error ? 'border-red-300' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept || `${category}/*`}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        {uploading ? (
          <div className="space-y-3">
            {/* アップロード中のアニメーション */}
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-indigo-500"></div>
              </div>
            </div>
            
            {/* ファイル情報 */}
            <div className="text-center">
              <p className="text-sm font-semibold text-indigo-700 animate-pulse">
                {category === 'video' ? '動画をアップロード中...' : 
                 category === 'audio' ? '音声をアップロード中...' : 
                 category === 'image' ? '画像をアップロード中...' : 
                 'ファイルをアップロード中...'}
              </p>
              {selectedFile && (
                <p className="text-xs text-gray-600 mt-1">
                  {selectedFile.name}
                </p>
              )}
              {selectedFile && (
                <p className="text-xs text-gray-500">
                  サイズ: {formatFileSize(selectedFile.size)}
                </p>
              )}
            </div>
            
            {/* プログレスバー */}
            <div className="px-4">
              <div className="relative">
                <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
                  <div 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out" 
                    style={{width: `${progress || 0}%`}}
                  >
                    {/* プログレスバー内のアニメーション */}
                    <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs font-semibold text-indigo-600">
                    {progress || 0}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {progress === 100 ? '処理中...' : 
                     progress >= 50 ? 'もう少しです...' : 
                     'アップロード中...'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* 大きなファイルの場合の注意書き */}
            {selectedFile && selectedFile.size > 50 * 1024 * 1024 && (
              <p className="text-xs text-amber-600 text-center">
                ⚠️ 大きなファイルのため、時間がかかる場合があります
              </p>
            )}
          </div>
        ) : value && showPreview ? (
          <div className="space-y-2">
            {category === 'image' && typeof value === 'string' ? (
              <div className="relative inline-block mx-auto">
                <Image 
                  src={value} 
                  alt={label}
                  width={192}
                  height={192}
                  className="rounded-lg object-contain"
                  style={{ maxHeight: '12rem', width: 'auto' }}
                />
              </div>
            ) : category === 'video' && typeof value === 'string' ? (
              <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg overflow-hidden border border-indigo-200">
                <div className="aspect-video max-w-sm mx-auto">
                  <video
                    controls
                    className="w-full h-full object-contain bg-black"
                    src={value}
                  >
                    お使いのブラウザは動画タグをサポートしていません。
                  </video>
                </div>
              </div>
            ) : (
              <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="text-sm font-medium text-green-700">アップロード済み</p>
            {selectedFile && (
              <p className="text-xs text-gray-600">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
            {!disabled && (
              <>
                <p className="text-xs text-gray-500">クリックまたはドラッグ&ドロップで変更</p>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    削除
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {placeholder?.icon || getDefaultIcon}
            <p className="text-sm font-medium text-gray-700">
              {placeholder?.title || `${category === 'image' ? '画像' : category === 'video' ? '動画' : category === 'audio' ? '音声' : ''}ファイルをドラッグ&ドロップ`}
            </p>
            <p className="text-xs text-gray-500">
              {placeholder?.subtitle || <>または<span className="text-indigo-600">クリックして選択</span></>}
            </p>
            <p className="text-xs text-gray-400">
              {placeholder?.formats || `対応形式: ${getDefaultFormats}`}
              {maxSizeMB && ` （最大${maxSizeMB}MB）`}
            </p>
          </div>
        )}
      </div>
      
      {/* 統一ステータスバー（showStatusBarが有効な場合） */}
      {showStatusBar && (status.isUploading || status.error) && (
        <UploadStatusBar
          isUploading={status.isUploading}
          progress={status.progress}
          fileName={status.fileName}
          fileSize={status.fileSize}
          fileType={status.fileType}
          error={status.error}
        />
      )}
    </div>
  )
})

FileUploadField.displayName = 'FileUploadField'