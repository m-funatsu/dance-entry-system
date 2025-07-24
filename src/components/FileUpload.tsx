'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { uploadFile, getFileIcon, FileUploadOptions } from '@/lib/storage'
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
      <div
        className={`relative rounded-2xl transition-all duration-200 ${
          isDisabled
            ? 'cursor-not-allowed'
            : dragOver
            ? 'transform scale-[1.02]'
            : 'hover:transform hover:scale-[1.01]'
        }`}
      >
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
          className={`block w-full p-8 rounded-2xl border-2 border-dashed transition-all duration-200 ${
            isDisabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : dragOver
              ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 cursor-pointer shadow-lg'
              : 'border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-indigo-300 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 cursor-pointer hover:shadow-md'
          }`}
          onDragOver={isDisabled ? undefined : handleDragOver}
          onDragLeave={isDisabled ? undefined : handleDragLeave}
          onDrop={isDisabled ? undefined : handleDrop}
        >
          <div className="flex flex-col items-center">
            <div className={`p-4 rounded-full ${
              isDisabled 
                ? 'bg-gray-100' 
                : dragOver
                ? 'bg-indigo-100'
                : 'bg-gradient-to-br from-indigo-100 to-purple-100'
            } mb-4 transition-all duration-200`}>
              <div className="text-4xl">
                {getFileIcon(fileType)}
              </div>
            </div>
            
            {isUploading ? (
              <div className="space-y-2 text-center">
                <span className="text-sm font-semibold text-gray-700">
                  アップロード中...
                </span>
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {uploadProgress}%
                </span>
              </div>
            ) : (
              <>
                <div className="text-center mb-2">
                  {isDisabled ? (
                    <span className="text-sm font-semibold text-gray-500">
                      {hasExistingFile ? 'アップロード済み' : 'アップロード不可'}
                    </span>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-900">
                        クリックして{getFileTypeLabel()}を選択
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        またはドラッグ＆ドロップ
                      </p>
                    </>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 flex items-center space-x-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                  <span>
                    {fileType === 'music' || fileType === 'audio' ? (
                      'MP3, WAV, AAC形式 (最大100MB)'
                    ) : fileType === 'photo' ? (
                      'JPG, PNG形式 (最大100MB)'
                    ) : fileType === 'video' ? (
                      'MP4, MOV, AVI形式 (最大200MB)'
                    ) : (
                      '最大100MB'
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        </label>
      </div>
    </div>
  )
}