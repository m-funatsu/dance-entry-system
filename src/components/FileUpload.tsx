'use client'

import { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'
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

export interface FileUploadRef {
  refreshFileStatus: () => void
}

const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(({
  userId,
  entryId,
  fileType,
  onUploadComplete,
  onUploadError
}, ref) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hasExistingFile, setHasExistingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const checkExistingFile = useCallback(async () => {
    if (fileType === 'video' || fileType === 'audio' || fileType === 'music') {
      console.log(`[FileUpload] checkExistingFile called for ${fileType}`)
      const supabase = createClient()
      const { data } = await supabase
        .from('entry_files')
        .select('id')
        .eq('entry_id', entryId)
        .eq('file_type', fileType)
        .limit(1)
      
      const hasFile = Boolean(data && data.length > 0)
      console.log(`[FileUpload] ${fileType} has existing file: ${hasFile}`)
      setHasExistingFile(hasFile)
    }
  }, [entryId, fileType])

  useEffect(() => {
    setMounted(true)
    checkExistingFile()
  }, [checkExistingFile])

  useImperativeHandle(ref, () => ({
    refreshFileStatus: () => {
      console.log(`[FileUpload] refreshFileStatus called for ${fileType}`)
      checkExistingFile()
    }
  }), [checkExistingFile, fileType])

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

  const handleClick = () => {
    if (hasExistingFile && (fileType === 'video' || fileType === 'audio' || fileType === 'music')) return
    fileInputRef.current?.click()
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
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDisabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : dragOver
            ? 'border-indigo-500 bg-indigo-50 cursor-pointer'
            : 'border-gray-300 hover:border-gray-400 cursor-pointer'
        }`}
        onDragOver={isDisabled ? undefined : handleDragOver}
        onDragLeave={isDisabled ? undefined : handleDragLeave}
        onDrop={isDisabled ? undefined : handleDrop}
        onClick={isDisabled ? undefined : handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedTypes()}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isDisabled}
        />
        
        <div className="flex flex-col items-center">
          <div className="text-4xl mb-2">
            {getFileIcon(fileType)}
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            {isDisabled ? (
              <span className="font-medium text-gray-500">
                {hasExistingFile ? 'アップロード済み' : 'アップロード不可'}
              </span>
            ) : (
              <>
                <span className="font-medium text-indigo-600">
                  {getFileTypeLabel()}をアップロード
                </span>
                {!isUploading && (
                  <>
                    <span className="text-gray-500"> または </span>
                    <span className="text-indigo-600">ここにドラッグ＆ドロップ</span>
                  </>
                )}
              </>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {fileType === 'music' || fileType === 'audio' ? (
              'MP3, WAV, AAC形式 (最大100MB)'
            ) : fileType === 'photo' ? (
              'JPG, PNG形式 (最大100MB)'
            ) : fileType === 'video' ? (
              'MP4, MOV, AVI形式 (最大200MB)'
            ) : (
              '最大100MB'
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
})

FileUpload.displayName = 'FileUpload'

export default FileUpload