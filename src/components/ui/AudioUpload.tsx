'use client'

import { useState, useRef, useEffect } from 'react'
import { AudioUploadProps } from '@/lib/types'

export const AudioUpload: React.FC<AudioUploadProps> = ({
  label,
  value,
  displayName,
  onChange,
  onDelete,
  disabled = false,
  required = false,
  maxSizeMB = 200,
  accept = '.wav,.mp3,.m4a'
}) => {
  console.log('[AUDIO UPLOAD DEBUG] === AudioUpload レンダリング ===')
  console.log('[AUDIO UPLOAD DEBUG] label:', label)
  console.log('[AUDIO UPLOAD DEBUG] value:', value)
  console.log('[AUDIO UPLOAD DEBUG] onDelete exists:', !!onDelete)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // valueが空になったら（削除された場合）、uploadingFileもクリア
  useEffect(() => {
    if (!value) {
      setUploadingFile(null)
      // inputフィールドもリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [value])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !value) {
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
    
    if (disabled || value) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    // ファイル拡張子をチェック
    const fileName = file.name.toLowerCase()
    const validExtensions = ['.wav', '.mp3', '.m4a']
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
    
    if (!hasValidExtension) {
      alert('WAV、MP3、M4A形式の音声ファイルを選択してください')
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
        onClick={() => !disabled && !value && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${disabled || value ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-indigo-50'}
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}
          ${value ? 'bg-green-50 border-green-300' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || !!value}
          className="hidden"
        />
        
        {value ? (
          <div className="space-y-3">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-700">アップロード済み</p>
            <p className="text-xs text-gray-600 mt-1">
              {displayName || (typeof value === 'string' && value.includes('http') ? 'ファイル名取得中...' : (typeof value === 'string' ? value : value?.name || 'ファイル名不明'))}
            </p>
            {uploadingFile && (
              <p className="text-xs text-gray-500 mt-1">
                サイズ: {formatFileSize(uploadingFile.size)}
              </p>
            )}
            
            {/* オーディオプレビュー */}
            {(value && typeof value === 'string') && (
              <div className="mt-3 px-4">
                <audio 
                  controls 
                  className="w-full"
                  preload="metadata"
                  src={value}
                >
                  <source src={value} type="audio/wav" />
                  <source src={value} type="audio/mpeg" />
                  <source src={value} type="audio/mp4" />
                  お使いのブラウザは音声タグをサポートしていません。
                </audio>
              </div>
            )}
            
            {/* 削除ボタン - valueがある場合は常に表示 */}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('このファイルを削除してもよろしいですか？')) {
                    onDelete()
                  }
                }}
                className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-full text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                削除
              </button>
            )}
            
            {!disabled && !onDelete && (
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
              対応形式: WAV, MP3, M4A（最大{maxSizeMB}MB）
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