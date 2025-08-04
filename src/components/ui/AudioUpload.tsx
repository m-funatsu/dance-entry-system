'use client'

import { useState, useRef } from 'react'

interface AudioUploadProps {
  label: string
  value?: string
  onChange: (file: File) => void
  disabled?: boolean
  required?: boolean
  maxSizeMB?: number
  accept?: string
}

export const AudioUpload: React.FC<AudioUploadProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  maxSizeMB = 100,
  accept = 'audio/*'
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('音声ファイルを選択してください')
      return
    }

    // ファイルサイズチェック
    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
      alert(`ファイルサイズが${maxSizeMB}MBを超えています`)
      return
    }

    setUploadingFile(file)
    onChange(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`relative ${disabled ? 'opacity-50' : ''}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-indigo-50'}
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}
          ${value ? 'bg-green-50 border-green-300' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        
        {value ? (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-700">アップロード済み</p>
            {uploadingFile && (
              <p className="text-xs text-gray-600">
                {uploadingFile.name} ({formatFileSize(uploadingFile.size)})
              </p>
            )}
            {!disabled && (
              <p className="text-xs text-gray-500">クリックまたはドラッグ&ドロップで変更</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              音声ファイルをドラッグ&ドロップ
            </p>
            <p className="text-xs text-gray-500">
              または<span className="text-indigo-600">クリックして選択</span>
            </p>
            <p className="text-xs text-gray-400">
              対応形式: MP3, WAV, AAC など（最大{maxSizeMB}MB）
            </p>
          </div>
        )}
        
        {uploadingFile && !value && (
          <div className="mt-3">
            <div className="bg-gray-200 rounded-full h-2 w-full">
              <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">アップロード中...</p>
          </div>
        )}
      </div>
    </div>
  )
}