'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { FormField, VideoUpload } from '@/components/ui'
import { useBaseForm, useFileUpload } from '@/hooks'
import { FormContainer, FormFooter } from '@/components/forms'
import type { Entry, SnsFormData } from '@/lib/types'

interface SNSFormProps {
  userId: string
  entry: Entry | null
}

export default function SNSForm({ entry }: SNSFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)

  // フォームの初期データ
  const initialData: SnsFormData = {
    entry_id: entry?.id || '',
    practice_video_path: '',
    practice_video_filename: '',
    introduction_highlight_path: '',
    introduction_highlight_filename: '',
    sns_notes: ''
  }

  // バリデーションルール
  const validationRules = {
    practice_video_path: { 
      required: true,
      custom: (value: unknown) => {
        if (!value) return '練習風景動画をアップロードしてください'
        return true
      }
    },
    introduction_highlight_path: { 
      required: true,
      custom: (value: unknown) => {
        if (!value) return '選手紹介・見所動画をアップロードしてください'
        return true
      }
    }
  }

  // useBaseFormフックを使用
  const {
    formData,
    handleFieldChange,
    save,
    saving,
    errors,
    error,
    success,
    setError,
    loading: formLoading
  } = useBaseForm<SnsFormData>({
    initialData,
    tableName: 'sns_info',
    uniqueField: 'entry_id',
    validationRules,
    redirectPath: '/dashboard',
    onSuccess: (message) => showToast(message, 'success'),
    onError: (error) => showToast(error, 'error')
  })

  // ファイルアップロードフック
  const { uploadVideo, uploading } = useFileUpload({
    onSuccess: (url, field) => {
      if (field) {
        handleFieldChange(`${field}_path` as keyof SnsFormData, url)
      }
    },
    onError: (error) => setError(error)
  })

  // データを読み込む
  useEffect(() => {
    if (!entry?.id) {
      setLoading(false)
      return
    }
    
    const loadData = async () => {
      try {
        const { data: snsData } = await supabase
          .from('sns_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()
        
        if (snsData) {
          // formDataを更新
          Object.keys(snsData).forEach(key => {
            if (key in formData) {
              handleFieldChange(key as keyof SnsFormData, snsData[key])
            }
          })
        }
      } catch {
        setError('データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [entry?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFileUpload = async (field: 'practice_video' | 'introduction_highlight', file: File) => {
    if (!entry?.id) {
      showToast('基本情報を先に保存してください', 'error')
      return
    }

    // ファイル名を保存
    handleFieldChange(`${field}_filename` as keyof SnsFormData, file.name)

    // 古いファイルを削除（存在する場合）
    const pathField = `${field}_path` as keyof SnsFormData
    const oldPath = formData[pathField]
    if (oldPath && typeof oldPath === 'string') {
      const oldFileName = oldPath.split('/').pop()
      if (oldFileName) {
        try {
          await supabase.storage
            .from('files')
            .remove([`${entry.id}/sns/${oldFileName}`])
        } catch {
          // エラーは無視（古いファイルが存在しない可能性もある）
        }
      }
    }

    // 新しいファイルをアップロード
    await uploadVideo(file, entry.id, field)
  }

  const handleSave = async (isTemporary = false) => {
    if (!entry?.id) {
      showToast('基本情報を先に保存してください', 'error')
      router.push('/dashboard/basic-info')
      return
    }

    await save(isTemporary)
  }

  if (loading || formLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <FormContainer
      title="SNS掲載情報"
      description="SNS掲載に使用する動画や情報をアップロードしてください"
      error={error}
      success={success}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            SNS掲載に使用する動画や情報をアップロードしてください。
            <span className="text-red-600 font-medium">（* は必須項目です）</span>
          </p>
        </div>

        {/* 練習風景動画 */}
        <div>
          <VideoUpload
            label="練習風景（約30秒）横長動画"
            required
            disabled={!entry}
            value={formData.practice_video_path}
            onChange={(file) => handleFileUpload('practice_video', file)}
            maxSizeMB={200}
          />
          {errors.practice_video_path && (
            <p className="mt-1 text-sm text-red-600">{errors.practice_video_path}</p>
          )}
        </div>

        {/* 選手紹介・見所動画 */}
        <div>
          <VideoUpload
            label="選手紹介・見所（30秒）"
            required
            disabled={!entry}
            value={formData.introduction_highlight_path}
            onChange={(file) => handleFileUpload('introduction_highlight', file)}
            maxSizeMB={100}
          />
          {errors.introduction_highlight_path && (
            <p className="mt-1 text-sm text-red-600">{errors.introduction_highlight_path}</p>
          )}
        </div>

        {/* 備考 */}
        <FormField
          label="備考"
          name="sns_notes"
          type="textarea"
          value={formData.sns_notes || ''}
          onChange={(e) => handleFieldChange('sns_notes', e.target.value)}
          rows={4}
          placeholder="SNS掲載に関する希望や注意事項があれば記入してください"
        />

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            ※ アップロードいただいた動画は、大会公式SNSでの告知や結果発表時に使用させていただく場合があります。
          </p>
        </div>

        <FormFooter
          onCancel={() => router.push('/dashboard')}
          onTemporarySave={() => handleSave(true)}
          onSave={() => handleSave(false)}
          saving={saving}
          loading={uploading}
          disabled={!entry}
          showCancel
        />

        {!entry && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              基本情報を先に保存してください。
            </p>
          </div>
        )}
      </div>
    </FormContainer>
  )
}