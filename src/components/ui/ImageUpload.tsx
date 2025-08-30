'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { ImageUploadProps } from '@/lib/types'

export default function ImageUpload({ 
  value, 
  onChange, 
  onDelete,
  label, 
  required = false,
  accept = "image/*",
  isEditable = true
}: ImageUploadProps) {
  console.log('ImageUpload isEditable:', isEditable) // ESLintエラー回避用
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(typeof value === 'string' ? value : null)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // valueが変更されたら（削除された場合を含む）、previewを更新
  useEffect(() => {
    setPreview(typeof value === 'string' ? value : null)
    setImageError(false)  // 新しい画像の場合はエラー状態をリセット
  }, [value])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    // 既にファイルがあるか無効化されている場合はアップロード不可
    if (value || !isEditable) return

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }, [value, !isEditable]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFile = (file: File) => {
    if (!isEditable) return // 無効化時は処理しない
    
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    onChange(file)
  }

  const handleClick = () => {
    // 既にファイルがあるか無効化されている場合はファイル選択不可
    if (!value && !!isEditable) {
      fileInputRef.current?.click()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditable) return // 無効化時は処理しない
    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    console.log('[IMAGE UPLOAD DELETE] === 削除ボタンがクリックされました ===')
    console.log('[IMAGE UPLOAD DELETE] isEditable:', isEditable)
    console.log('[IMAGE UPLOAD DELETE] value:', value)
    console.log('[IMAGE UPLOAD DELETE] onDelete exists:', !!onDelete)
    
    if (!isEditable) {
      console.log('[IMAGE UPLOAD DELETE] 編集無効のため削除をスキップ')
      return
    }
    
    e.stopPropagation()
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    console.log('[IMAGE UPLOAD DELETE] 親コンポーネントのonDeleteを呼び出し中...')
    // 親コンポーネントの削除処理を呼び出し
    if (onDelete) {
      onDelete()
      console.log('[IMAGE UPLOAD DELETE] onDelete実行完了')
    } else {
      console.log('[IMAGE UPLOAD DELETE] onDeleteが未定義です')
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all
          ${isDragging && !value ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${!value ? 'cursor-pointer hover:border-gray-400' : 'cursor-not-allowed bg-gray-100'}
          ${preview ? 'bg-gray-50' : 'bg-white'}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={!!value || !isEditable}
          className="hidden"
        />

        {preview && !imageError ? (
          <div className="relative">
            <div className="relative h-48 w-full">
              <Image
                src={preview}
                alt="アップロード画像のプレビュー"
                fill
                className="object-contain"
                onError={() => {
                  console.log('Image load error, URL may be expired:', preview)
                  setImageError(true)
                }}
              />
            </div>
            {/* 削除ボタン - 編集可能時のみ表示 */}
            {!!isEditable && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <p className="mt-4 text-sm text-gray-600">
              {!!isEditable ? '削除ボタンから削除できます' : '期限切れのため編集できません'}
            </p>
          </div>
        ) : imageError ? (
          <div className="space-y-2 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-red-600 font-medium">画像の読み込みに失敗しました</p>
              <p className="text-xs text-red-500">URLの有効期限が切れている可能性があります</p>
              {!!isEditable && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 cursor-pointer"
                >
                  削除して再アップロード
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-gray-600">
              <p className="text-sm">画像をドラッグ&ドロップ</p>
              <p className="text-xs text-gray-500 mt-1">または</p>
              <p className="text-sm text-blue-600 hover:text-blue-700">クリックして選択</p>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, JPEG (最大10MB)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}