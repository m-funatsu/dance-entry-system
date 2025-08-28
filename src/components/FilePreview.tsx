'use client'

import { useState } from 'react'
import Image from 'next/image'

interface FilePreviewProps {
  filePath?: string
  fileName?: string
  fileType: 'image' | 'video'
  className?: string
}

export default function FilePreview({ filePath, fileName, fileType, className = '' }: FilePreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [videoError, setVideoError] = useState(false)

  if (!filePath) {
    return <span className="text-gray-500">未設定</span>
  }

  // SupabaseストレージのパブリックURLを構築
  const publicUrl = `https://ckffwsmgtivqjqkhppkj.supabase.co/storage/v1/object/public/files/${filePath}`

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
              {fileType === 'image' ? (
                imageError ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">画像の読み込みに失敗しました</p>
                    <p className="text-sm text-gray-400 mt-2">ファイル: {filePath}</p>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Image
                      src={publicUrl}
                      alt={fileName || 'プレビュー画像'}
                      width={800}
                      height={600}
                      className="max-w-full h-auto rounded"
                      onError={() => setImageError(true)}
                      unoptimized={true}
                    />
                  </div>
                )
              ) : (
                videoError ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">動画の読み込みに失敗しました</p>
                    <p className="text-sm text-gray-400 mt-2">ファイル: {filePath}</p>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <video
                      src={publicUrl}
                      controls
                      className="max-w-full max-h-[60vh] rounded"
                      onError={() => setVideoError(true)}
                    >
                      お使いのブラウザは動画再生に対応していません。
                    </video>
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