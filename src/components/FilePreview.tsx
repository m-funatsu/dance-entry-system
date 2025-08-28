'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface FilePreviewProps {
  filePath?: string
  fileName?: string
  fileType: 'image' | 'video' | 'audio'
  className?: string
}

export default function FilePreview({ filePath, fileName, fileType, className = '' }: FilePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string>('')
  const [urlLoading, setUrlLoading] = useState(false)

  // Supabase署名付きURLを取得
  const getSignedUrl = useCallback(async () => {
    if (!filePath || signedUrl) return

    setUrlLoading(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .createSignedUrl(filePath, 3600) // 1時間有効

      if (error) {
        console.error('署名付きURL取得エラー:', error)
      } else if (data?.signedUrl) {
        setSignedUrl(data.signedUrl)
      }
    } catch (error) {
      console.error('URL取得失敗:', error)
    } finally {
      setUrlLoading(false)
    }
  }, [filePath, signedUrl])

  useEffect(() => {
    if (isOpen && !signedUrl && !urlLoading && filePath) {
      getSignedUrl()
    }
  }, [isOpen, signedUrl, urlLoading, filePath, getSignedUrl])

  if (!filePath) {
    return <span className="text-gray-500">未設定</span>
  }

  const handlePreviewClick = () => {
    setIsOpen(true)
  }

  const handleCloseModal = () => {
    setIsOpen(false)
  }

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-green-600 font-medium">アップロード済み</span>
        <button
          onClick={handlePreviewClick}
          className="text-blue-600 hover:text-blue-800 underline text-sm"
        >
          プレビュー
        </button>
      </div>

      {/* プレビューモーダル */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {fileName || 'ファイルプレビュー'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 max-h-[80vh] overflow-auto">
              {urlLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">ファイルを読み込み中...</p>
                </div>
              ) : !signedUrl ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">ファイルのURLを取得できませんでした</p>
                  <p className="text-sm text-gray-400 mt-2">ファイル: {filePath}</p>
                </div>
              ) : fileType === 'image' ? (
                imageError ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">画像の読み込みに失敗しました</p>
                    <p className="text-sm text-gray-400 mt-2">ファイル: {filePath}</p>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Image
                      src={signedUrl}
                      alt={fileName || 'プレビュー画像'}
                      width={800}
                      height={600}
                      className="max-w-full h-auto rounded"
                      onError={() => setImageError(true)}
                      unoptimized={true}
                    />
                  </div>
                )
              ) : fileType === 'video' ? (
                videoError ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">動画の読み込みに失敗しました</p>
                    <p className="text-sm text-gray-400 mt-2">ファイル: {filePath}</p>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <video
                      src={signedUrl}
                      controls
                      className="max-w-full max-h-[60vh] rounded"
                      onError={() => setVideoError(true)}
                    >
                      お使いのブラウザは動画再生に対応していません。
                    </video>
                  </div>
                )
              ) : (
                audioError ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">音楽ファイルの読み込みに失敗しました</p>
                    <p className="text-sm text-gray-400 mt-2">ファイル: {filePath}</p>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <audio
                      src={signedUrl}
                      controls
                      className="w-full max-w-md"
                      onError={() => setAudioError(true)}
                    >
                      お使いのブラウザは音楽再生に対応していません。
                    </audio>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}