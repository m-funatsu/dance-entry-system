'use client'

import { useState, useRef } from 'react'
import FileUpload, { FileUploadRef } from '@/components/FileUpload'
import FileList from '@/components/FileList'

interface UploadManagerProps {
  userId: string
  entryId: string
  isDeadlinePassed: boolean
  settings: Record<string, string>
}

export default function UploadManager({ userId, entryId, isDeadlinePassed, settings }: UploadManagerProps) {
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const fileUploadRefs = useRef<{ [key: string]: FileUploadRef | null }>({})

  const setFileUploadRef = (fileType: string, ref: FileUploadRef | null) => {
    fileUploadRefs.current[fileType] = ref
  }

  const handleUploadComplete = () => {
    setUploadSuccess('ファイルのアップロードが完了しました')
    setUploadError('')
    setRefreshKey(prev => prev + 1)
  }

  const handleUploadError = (error: string) => {
    setUploadError(error)
    setUploadSuccess('')
  }

  const handleFileDeleted = (deletedFileType: string) => {
    console.log(`[UploadManager] File deleted: ${deletedFileType}`)
    setUploadSuccess('ファイルを削除しました')
    setUploadError('')
    setRefreshKey(prev => prev + 1)
    
    // Refresh the corresponding FileUpload component
    const fileUploadRef = fileUploadRefs.current[deletedFileType]
    console.log(`[UploadManager] FileUpload ref for ${deletedFileType}:`, fileUploadRef)
    if (fileUploadRef) {
      console.log(`[UploadManager] Calling refreshFileStatus for ${deletedFileType}`)
      fileUploadRef.refreshFileStatus()
    } else {
      console.log(`[UploadManager] No ref found for ${deletedFileType}`)
    }
  }

  const fileTypes = [
    { type: 'music' as const, label: '楽曲', description: 'ダンスで使用する楽曲' },
    { type: 'audio' as const, label: '音源', description: 'その他の音源ファイル' },
    { type: 'photo' as const, label: '写真', description: 'チーム写真やプロフィール写真' },
    { type: 'video' as const, label: '動画', description: 'パフォーマンス動画' },
  ]

  return (
    <div className="space-y-8">
      {uploadSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{uploadSuccess}</p>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{uploadError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {fileTypes.map((fileType) => (
          <div key={fileType.type} className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                {fileType.label}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {fileType.description}
              </p>
              
              {!isDeadlinePassed && (
                <div className="mb-6">
                  <FileUpload
                    key={fileType.type}
                    ref={(ref) => setFileUploadRef(fileType.type, ref)}
                    userId={userId}
                    entryId={entryId}
                    fileType={fileType.type}
                    onUploadComplete={handleUploadComplete}
                    onUploadError={handleUploadError}
                  />
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  アップロード済みファイル
                </h4>
                <FileList
                  key={`${fileType.type}-${refreshKey}`}
                  entryId={entryId}
                  fileType={fileType.type}
                  editable={!isDeadlinePassed}
                  onFileDeleted={(fileId, fileType) => handleFileDeleted(fileType)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            アップロード制限
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>最大ファイルサイズ:</strong> {settings.max_file_size_mb || '100'}MB
            </div>
            <div>
              <strong>動画形式:</strong> {settings.allowed_video_formats || 'mp4,mov,avi'}
            </div>
            <div>
              <strong>音声形式:</strong> {settings.allowed_audio_formats || 'mp3,wav,aac'}
            </div>
            <div>
              <strong>画像形式:</strong> {settings.allowed_image_formats || 'jpg,jpeg,png'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}