'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getFileUrl, deleteFile, formatFileSize, getFileIcon } from '@/lib/storage'
import { formatDateLocale } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import type { EntryFile } from '@/lib/types'

interface FileListProps {
  entryId: string
  editable?: boolean
  fileType?: 'music' | 'audio' | 'photo' | 'video'
  onFileDeleted?: (fileId: string, fileType: string) => void
  refreshKey?: number
  showMusicLabels?: boolean
  useDifferentSongs?: boolean
}

export default function FileList({ entryId, editable = false, fileType, onFileDeleted, refreshKey, showMusicLabels = false, useDifferentSongs = false }: FileListProps) {
  const [files, setFiles] = useState<EntryFile[]>([])
  const [loading, setLoading] = useState(true)
  const [fileUrls, setFileUrls] = useState<{ [key: string]: string }>({})
  const { showToast } = useToast()

  const fetchFiles = useCallback(async () => {
    const supabase = createClient()
    
    try {
      let query = supabase
        .from('entry_files')
        .select('*')
        .eq('entry_id', entryId)

      if (fileType) {
        query = query.eq('file_type', fileType)
      }

      const { data, error } = await query.order('uploaded_at', { ascending: true })

      if (error) {
        console.error('Error fetching files:', error)
        return
      }

      setFiles(data || [])
      
      const urls: { [key: string]: string } = {}
      for (const file of data || []) {
        const url = await getFileUrl(file.file_path)
        if (url) {
          urls[file.id] = url
        }
      }
      setFileUrls(urls)
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }, [entryId, fileType])

  useEffect(() => {
    fetchFiles()
  }, [fetchFiles, refreshKey])

  const handleDelete = async (fileId: string) => {
    if (!confirm('このファイルを削除しますか？')) return

    const fileToDelete = files.find(f => f.id === fileId)
    const success = await deleteFile(fileId)
    if (success) {
      setFiles(files.filter(f => f.id !== fileId))
      showToast('ファイルを削除しました', 'success')
      if (fileToDelete) {
        onFileDeleted?.(fileId, fileToDelete.file_type)
      }
    } else {
      showToast('ファイルの削除に失敗しました', 'error')
    }
  }

  const getFileTypeLabel = (fileType: string) => {
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

  const renderPreview = (file: EntryFile) => {
    const url = fileUrls[file.id]
    if (!url) return null

    if (file.file_type === 'photo') {
      return (
        <div className="w-16 h-16 rounded overflow-hidden bg-gray-100">
          <Image
            src={url}
            alt={file.file_name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
      )
    }

    if (file.file_type === 'video') {
      return (
        <video
          src={url}
          className="w-16 h-16 object-cover rounded"
          controls={false}
        />
      )
    }

    return (
      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded">
        <span className="text-2xl">{getFileIcon(file.file_type)}</span>
      </div>
    )
  }

  const renderMediaPlayer = (file: EntryFile) => {
    const url = fileUrls[file.id]
    if (!url) return null

    if (file.file_type === 'photo') {
      return (
        <div className="mt-2">
          <div className="max-w-full max-h-64 bg-gray-100 rounded overflow-hidden">
            <Image
              src={url}
              alt={file.file_name}
              width={800}
              height={256}
              className="max-w-full max-h-64 object-contain rounded"
              unoptimized
            />
          </div>
        </div>
      )
    }

    if (file.file_type === 'video') {
      return (
        <div className="mt-2">
          <video
            src={url}
            controls
            className="max-w-full max-h-64 rounded"
          >
            お使いのブラウザは動画再生に対応していません。
          </video>
        </div>
      )
    }

    if (file.file_type === 'music' || file.file_type === 'audio') {
      return (
        <div className="mt-2">
          <audio
            src={url}
            controls
            className="w-full"
          >
            お使いのブラウザは音声再生に対応していません。
          </audio>
        </div>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        アップロードされたファイルはありません
      </div>
    )
  }

  // 動画ファイルの場合は予選と同じスタイルで表示
  if (fileType === 'video' && files.length > 0) {
    const file = files[0] // 動画は1つのみ
    return (
      <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {file.file_name}
              </p>
              <p className="text-sm text-gray-600">
                ビデオファイル • {file.file_size && `${(file.file_size / 1024 / 1024).toFixed(2)} MB`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                アップロード完了
              </p>
            </div>
          </div>
          {editable && (
            <button
              type="button"
              onClick={() => handleDelete(file.id)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {files.map((file, index) => (
        <div key={file.id} className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {renderPreview(file)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {getFileTypeLabel(file.file_type)}
                  </span>
                  {showMusicLabels && file.file_type === 'music' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {!useDifferentSongs && files.length === 1 ? '準決勝・決勝共通' : 
                       index === 0 ? '準決勝用' : 
                       index === 1 && useDifferentSongs ? '決勝用' : 
                       `${index + 1}つ目`}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {formatFileSize(file.file_size || 0)}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.file_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateLocale(file.uploaded_at)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {fileUrls[file.id] && (
                <a
                  href={fileUrls[file.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-900 text-sm"
                >
                  ダウンロード
                </a>
              )}
              {editable && (
                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  削除
                </button>
              )}
            </div>
          </div>
          
          {renderMediaPlayer(file)}
        </div>
      ))}
    </div>
  )
}