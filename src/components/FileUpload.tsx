'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { uploadFile, FileUploadOptions } from '@/lib/storage'
import { useToast } from '@/contexts/ToastContext'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  userId: string
  entryId: string
  fileType: 'music' | 'audio' | 'photo' | 'video'
  onUploadComplete?: (fileId: string, filePath: string) => void
  onUploadError?: (error: string) => void
}

export default function FileUpload({
  userId,
  entryId,
  fileType,
  onUploadComplete,
  onUploadError
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hasExistingFile, setHasExistingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const checkExistingFile = useCallback(async () => {
    if (fileType === 'video' || fileType === 'audio' || fileType === 'music') {
      const supabase = createClient()
      const { data } = await supabase
        .from('entry_files')
        .select('id')
        .eq('entry_id', entryId)
        .eq('file_type', fileType)
        .limit(1)
      
      setHasExistingFile(Boolean(data && data.length > 0))
    }
  }, [entryId, fileType])

  useEffect(() => {
    setMounted(true)
    checkExistingFile()
  }, [checkExistingFile])

  if (!mounted) {
    return <div className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
  }

  const getAcceptedTypes = () => {
    switch (fileType) {
      case 'music':
      case 'audio':
        return '.mp3,.wav,.aac'
      case 'photo':
        return '.jpg,.jpeg,.png'
      case 'video':
        return '.mp4,.mov,.avi'
      default:
        return '*'
    }
  }

  const getFileTypeLabel = () => {
    switch (fileType) {
      case 'music':
        return '楽曲'
      case 'audio':
        return '音源'
      case 'photo':
        return '写真'
      case 'video':
        return '動画'
      default:
        return 'ファイル'
    }
  }

  const handleFileSelect = async (file: File) => {
    if (isUploading) return

    // Check if file already exists for single-file types
    if ((fileType === 'video' || fileType === 'audio' || fileType === 'music') && hasExistingFile) {
      showToast('この種類のファイルは1つまでしかアップロードできません', 'error')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const options: FileUploadOptions = {
        userId,
        entryId,
        fileType,
        file
      }

      const result = await uploadFile(options)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success && result.fileId && result.filePath) {
        showToast('ファイルのアップロードが完了しました', 'success')
        setHasExistingFile(true)
        onUploadComplete?.(result.fileId, result.filePath)
      } else {
        showToast(result.error || 'アップロードに失敗しました', 'error')
        onUploadError?.(result.error || 'アップロードに失敗しました')
      }
    } catch {
      showToast('アップロードに失敗しました', 'error')
      onUploadError?.('アップロードに失敗しました')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const isDisabled = isUploading || (hasExistingFile && (fileType === 'video' || fileType === 'audio' || fileType === 'music'))

  return (
    <div className="w-full">
      {hasExistingFile && (fileType === 'video' || fileType === 'audio' || fileType === 'music') && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            {getFileTypeLabel()}は1つまでしかアップロードできません。新しいファイルをアップロードするには、既存のファイルを削除してください。
          </p>
        </div>
      )}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedTypes()}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isDisabled}
          id={`file-upload-${fileType}`}
        />
        
        <label
          htmlFor={isDisabled ? undefined : `file-upload-${fileType}`}
          className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all duration-200 ${
            isDisabled
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : dragOver
              ? 'border-gray-400 bg-gray-100'
              : 'border-gray-300 bg-white hover:bg-gray-50'
          }`}
          onDragOver={isDisabled ? undefined : handleDragOver}
          onDragLeave={isDisabled ? undefined : handleDragLeave}
          onDrop={isDisabled ? undefined : handleDrop}
        >
          {fileType === 'video' ? (
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25H13.5" />
            </svg>
          ) : fileType === 'music' || fileType === 'audio' ? (
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          ) : (
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          )}
          
          {isUploading ? (
            <div className="mt-4">
              <span className="text-sm font-semibold text-gray-900">
                アップロード中...
              </span>
              <div className="mt-3">
                <div className="bg-gray-200 rounded-full h-2 w-full max-w-xs mx-auto overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-indigo-600">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <>
              <span className="mt-2 block text-sm font-semibold text-gray-900">
                {isDisabled ? (hasExistingFile ? 'アップロード済み' : 'アップロード不可') : `クリックして${getFileTypeLabel()}を選択`}
              </span>
              {!isDisabled && (
                <span className="mt-1 block text-xs text-gray-600">
                  またはドラッグ＆ドロップ
                </span>
              )}
              <span className="mt-2 block text-xs text-gray-500">
                {fileType === 'music' || fileType === 'audio' ? (
                  'MP3、WAV、AAC形式（最大100MB）'
                ) : fileType === 'photo' ? (
                  'JPG、PNG形式（最大100MB）'
                ) : fileType === 'video' ? (
                  'MP4、MOV、AVI形式（最大200MB）'
                ) : (
                  '最大100MB'
                )}
              </span>
            </>
          )}
        </label>
      </div>
    </div>
  )
}