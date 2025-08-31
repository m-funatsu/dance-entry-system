'use client'

import { useState, useEffect, useMemo } from 'react'

export interface UploadStatusBarProps {
  isUploading: boolean
  progress: number
  fileName?: string
  fileSize?: number
  fileType?: 'video' | 'audio' | 'photo' | 'music' | 'document'
  error?: string | null
  onRetry?: () => void
  className?: string
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const UploadStatusBar = ({
  isUploading,
  progress,
  fileName,
  fileSize,
  fileType,
  error,
  onRetry,
  className = ''
}: UploadStatusBarProps) => {
  const [displayProgress, setDisplayProgress] = useState(0)
  
  // プログレスのスムースアニメーション
  useEffect(() => {
    if (isUploading) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setDisplayProgress(0)
    }
  }, [progress, isUploading])

  const getFileTypeLabel = useMemo(() => {
    switch (fileType) {
      case 'video': return '動画'
      case 'audio': return '音声'
      case 'photo': return '画像'
      case 'music': return '楽曲'
      case 'document': return 'ファイル'
      default: return 'ファイル'
    }
  }, [fileType])

  const getStatusMessage = useMemo(() => {
    if (error) return `エラー: ${error}`
    if (!isUploading) return ''
    
    if (progress >= 95) return '処理を完了しています...'
    if (progress >= 80) return 'もう少しで完了です...'
    if (progress >= 50) return 'アップロード中です...'
    return 'アップロードを開始しています...'
  }, [isUploading, progress, error])

  const getProgressColor = useMemo(() => {
    if (error) return 'bg-red-500'
    if (progress >= 90) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    return 'bg-indigo-500'
  }, [progress, error])

  if (!isUploading && !error) return null

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full bg-white border border-gray-200 rounded-lg shadow-lg ${className}`}>
      <div className="p-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {error ? (
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : isUploading ? (
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : (
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <h3 className="text-sm font-semibold text-gray-900">
              {error ? 'アップロードエラー' : isUploading ? `${getFileTypeLabel}をアップロード中` : 'アップロード完了'}
            </h3>
          </div>
          
          {!isUploading && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => {
                // ステータスバーを閉じる処理（親コンポーネントで実装）
                // この例では単純に非表示にする
                const element = document.querySelector('.upload-status-bar')
                if (element) {
                  element.remove()
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ファイル情報 */}
        {fileName && (
          <div className="mb-3">
            <p className="text-sm text-gray-700 truncate">{fileName}</p>
            {fileSize && (
              <p className="text-xs text-gray-500">{formatFileSize(fileSize)}</p>
            )}
          </div>
        )}

        {/* プログレスバー */}
        {isUploading && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">{displayProgress}%</span>
              <span className="text-xs text-gray-500">{getStatusMessage}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${getProgressColor}`}
                style={{ width: `${displayProgress}%` }}
              >
                {/* プログレスバー内のアニメーション */}
                <div className="h-full w-full bg-white bg-opacity-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* エラー表示とリトライボタン */}
        {error && onRetry && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={onRetry}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              再試行
            </button>
          </div>
        )}

        {/* 大きなファイルの場合の注意書き */}
        {isUploading && fileSize && fileSize > 50 * 1024 * 1024 && (
          <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs text-amber-700 flex items-center">
              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              大きなファイルのため、時間がかかる場合があります
            </p>
          </div>
        )}
      </div>
    </div>
  )
}