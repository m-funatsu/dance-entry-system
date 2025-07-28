'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry, SNSInfo } from '@/lib/types'

interface SNSFormProps {
  userId: string
  entry: Entry | null
}

// 動画ファイルアップロードコンポーネント
function VideoFileUpload({ 
  label,
  disabled, 
  value, 
  fileName,
  onChange,
  maxSizeMB = 200
}: { 
  label: string
  disabled?: boolean
  value?: string
  fileName?: string
  onChange: (file: File) => void
  maxSizeMB?: number
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('video/')) {
        // ファイルサイズチェック
        const maxSize = maxSizeMB * 1024 * 1024
        if (file.size > maxSize) {
          alert(`ファイルサイズが${maxSizeMB}MBを超えています`)
          return
        }
        setUploadingFile(file)
        onChange(file)
      } else {
        alert('動画ファイルを選択してください')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ファイルサイズチェック
      const maxSize = maxSizeMB * 1024 * 1024
      if (file.size > maxSize) {
        alert(`ファイルサイズが${maxSizeMB}MBを超えています`)
        e.target.value = ''
        return
      }
      setUploadingFile(file)
      onChange(file)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`relative ${disabled ? 'opacity-50' : ''}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-200
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-indigo-50'}
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}
          ${value ? 'bg-green-50 border-green-300' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />
        
        {value ? (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-700">アップロード済み</p>
            {(uploadingFile || fileName) && (
              <p className="text-xs text-gray-600">
                {uploadingFile ? `${uploadingFile.name} (${formatFileSize(uploadingFile.size)})` : fileName}
              </p>
            )}
            {!disabled && (
              <p className="text-xs text-gray-500">クリックまたはドラッグ&ドロップで変更</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              動画ファイルをドラッグ&ドロップ
            </p>
            <p className="text-xs text-gray-500">
              または<span className="text-indigo-600">クリックして選択</span>
            </p>
            <p className="text-xs text-gray-400">
              対応形式: MP4, MOV, AVI など（最大{maxSizeMB}MB）
            </p>
          </div>
        )}
        
        {uploadingFile && !value && (
          <div className="mt-3">
            <div className="bg-gray-200 rounded-full h-2 w-full">
              <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">アップロード中...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SNSForm({ entry }: SNSFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [snsInfo, setSnsInfo] = useState<Partial<SNSInfo>>({
    entry_id: entry?.id || '',
    practice_video_path: '',
    practice_video_filename: '',
    introduction_highlight_path: '',
    introduction_highlight_filename: '',
    sns_notes: ''
  })

  // データを読み込む
  useEffect(() => {
    if (!entry?.id) return
    
    const loadData = async () => {
      try {
        // SNS情報を取得
        const { data: snsData } = await supabase
          .from('sns_info')
          .select('*')
          .eq('entry_id', entry.id)
          .single()
        
        if (snsData) {
          setSnsInfo(snsData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [entry?.id, supabase])

  const handleSave = async (isTemporary = false) => {
    setSaving(true)

    try {
      if (!entry?.id) {
        showToast('基本情報を先に保存してください', 'error')
        router.push('/dashboard/basic-info')
        return
      }

      const { data: existingData } = await supabase
        .from('sns_info')
        .select('id')
        .eq('entry_id', entry.id)
        .single()

      if (existingData) {
        // 更新
        const { error } = await supabase
          .from('sns_info')
          .update({
            ...snsInfo,
            entry_id: entry.id,
            updated_at: new Date().toISOString()
          })
          .eq('entry_id', entry.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('sns_info')
          .insert({
            ...snsInfo,
            entry_id: entry.id
          })

        if (error) throw error
      }

      showToast(
        isTemporary ? 'SNS掲載情報を一時保存しました' : 'SNS掲載情報を保存しました', 
        'success'
      )
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving SNS info:', error)
      
      // エラーの詳細を確認
      let errorMessage = 'SNS掲載情報の保存に失敗しました'
      
      if (error && typeof error === 'object' && 'message' in error) {
        const err = error as { message?: string; details?: unknown; hint?: string }
        errorMessage = err.message || errorMessage
        
        // Supabaseのエラーレスポンスを詳しく表示
        if (err.details) {
          console.error('Error details:', err.details)
        }
        if (err.hint) {
          console.error('Error hint:', err.hint)
        }
      }
      
      showToast(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (field: 'practice_video' | 'introduction_highlight', file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${entry?.id}/sns/${field}_${Date.now()}.${fileExt}`
      
      // 古いファイルを削除（存在する場合）
      const pathField = `${field}_path` as keyof SNSInfo
      const oldPath = snsInfo[pathField]
      if (oldPath && typeof oldPath === 'string') {
        const oldFileName = oldPath.split('/').pop()
        if (oldFileName) {
          await supabase.storage
            .from('files')
            .remove([`${entry?.id}/sns/${oldFileName}`])
        }
      }
      
      // 新しいファイルをアップロード
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      setSnsInfo(prev => ({
        ...prev,
        [`${field}_path`]: publicUrl,
        [`${field}_filename`]: file.name
      }))
      
      showToast('ファイルをアップロードしました', 'success')
    } catch (err) {
      console.error('ファイルアップロードエラー:', err)
      showToast('ファイルのアップロードに失敗しました', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          SNS掲載に使用する動画や情報をアップロードしてください。
        </p>
      </div>

      {/* 練習風景動画 */}
      <VideoFileUpload
        label="練習風景（1分程度）"
        disabled={false}
        value={snsInfo.practice_video_path}
        fileName={snsInfo.practice_video_filename}
        onChange={(file) => handleFileUpload('practice_video', file)}
        maxSizeMB={200}
      />

      {/* 選手紹介・見所動画 */}
      <VideoFileUpload
        label="選手紹介・見所（30秒）"
        disabled={false}
        value={snsInfo.introduction_highlight_path}
        fileName={snsInfo.introduction_highlight_filename}
        onChange={(file) => handleFileUpload('introduction_highlight', file)}
        maxSizeMB={100}
      />

      {/* 備考 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          備考
        </label>
        <textarea
          value={snsInfo.sns_notes || ''}
          onChange={(e) => setSnsInfo(prev => ({ ...prev, sns_notes: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          rows={4}
          placeholder="SNS掲載に関する希望や注意事項があれば記入してください"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          ※ アップロードいただいた動画は、大会公式SNSでの告知や結果発表時に使用させていただく場合があります。
        </p>
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          キャンセル
        </button>
        <div className="space-x-4">
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !entry}
            className={`px-6 py-2 rounded-md text-sm font-medium ${
              saving || !entry
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {saving ? '一時保存中...' : '一時保存'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !entry}
            className={`px-6 py-2 rounded-md text-sm font-medium text-white ${
              saving || !entry
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {!entry && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            基本情報を先に保存してください。
          </p>
        </div>
      )}
    </div>
  )
}