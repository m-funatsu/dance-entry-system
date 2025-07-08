'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadFile, getFileIcon, FileUploadOptions } from '@/lib/storage'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

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
        onUploadComplete?.(result.fileId, result.filePath)
      } else {
        onUploadError?.(result.error || 'アップロードに失敗しました')
      }
    } catch {
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

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedTypes()}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center">
          <div className="text-4xl mb-2">
            {getFileIcon(fileType)}
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium text-indigo-600">
              {getFileTypeLabel()}をアップロード
            </span>
            {!isUploading && (
              <>
                <span className="text-gray-500"> または </span>
                <span className="text-indigo-600">ここにドラッグ＆ドロップ</span>
              </>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {fileType === 'music' || fileType === 'audio' ? (
              'MP3, WAV, AAC形式 (最大25MB)'
            ) : fileType === 'photo' ? (
              'JPG, PNG形式 (最大25MB)'
            ) : fileType === 'video' ? (
              'MP4, MOV, AVI形式 (最大50MB)'
            ) : (
              '最大25MB'
            )}
          </div>
        </div>
        
        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">
              アップロード中... {uploadProgress}%
            </div>
          </div>
        )}
      </div>
    </div>
  )
}