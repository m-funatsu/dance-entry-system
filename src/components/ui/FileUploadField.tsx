'use client'

import { useState, useRef, memo, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { FileCategory, formatFileSize, validateFile } from '@/lib/file-upload'
import { useFileUploadV2 } from '@/hooks/useFileUploadV2'

export interface FileUploadFieldProps {
  label: string
  value?: string | null
  onChange: (file: File) => void
  onUploadComplete?: (url: string) => void
  category?: FileCategory
  disabled?: boolean
  required?: boolean
  maxSizeMB?: number
  accept?: string
  uploadPath?: (fileName: string) => string
  placeholder?: {
    icon?: React.ReactNode
    title?: string
    subtitle?: string
    formats?: string
  }
}

export const FileUploadField = memo<FileUploadFieldProps>(({
  label,
  value,
  onChange,
  onUploadComplete,
  category = 'document',
  disabled = false,
  required = false,
  maxSizeMB,
  accept,
  uploadPath,
  placeholder
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    
    // 自動アップロード（uploadPathが提供されている場合）
    if (uploadPath && onUploadComplete) {
      await upload(file)
    }
  }, [category, maxSizeMB, onChange, uploadPath, onUploadComplete, upload])

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
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

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
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-sm font-medium text-indigo-700">アップロード中...</p>
            {selectedFile && (
              <p className="text-xs text-gray-600">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
            {progress > 0 && (
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2 w-full">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                    style={{width: `${progress}%`}}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">{progress}%</p>
              </div>
            )}
          </div>
        ) : value ? (
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
              <p className="text-xs text-gray-500">クリックまたはドラッグ&ドロップで変更</p>
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
    </div>
  )
})

FileUploadField.displayName = 'FileUploadField'