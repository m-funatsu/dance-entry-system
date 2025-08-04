'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { FormField, VideoUpload, Alert, Button } from '@/components/ui'
import { useBaseForm } from '@/hooks'
import { useFileUploadV2 } from '@/hooks/useFileUploadV2'
import { ValidationPresets } from '@/lib/validation'
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

  // バリデーションルール（新しいヘルパーを使用）
  const validationRules = {
    practice_video_path: ValidationPresets.requiredFile('練習風景動画をアップロードしてください'),
    introduction_highlight_path: ValidationPresets.requiredFile('選手紹介・見所動画をアップロードしてください'),
    sns_notes: ValidationPresets.optionalText(500)
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

  // ファイルアップロードフック（新システム）
  const { uploadVideo, uploading, deleteFile } = useFileUploadV2({
    category: 'video',
    generatePath: (fileName, fileInfo) => {
      if (!fileInfo?.entryId || !fileInfo?.field) return fileName
      return `${fileInfo.entryId}/sns/${fileInfo.field}/${fileName}`
    },
    onSuccess: (result) => {
      if (result.field && result.url) {
        handleFieldChange(`${result.field}_path` as keyof SnsFormData, result.url)
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
      // URLからパスを抽出
      const pathMatch = oldPath.match(/files\/(.+)$/)
      if (pathMatch) {
        await deleteFile(pathMatch[1])
      }
    }

    // 新しいファイルをアップロード
    await uploadVideo(file, {
      entryId: entry.id,
      field
    })
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
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          SNS掲載情報の登録
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          SNS掲載に使用する動画や情報をアップロードしてください。
        </p>
      </div>

      <div className="space-y-6">

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

        {!entry && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              基本情報を先に保存してください。
            </p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/dashboard')}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSave(true)}
            disabled={saving || uploading || !entry}
          >
            一時保存
          </Button>
          <Button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving || uploading || !entry}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </form>
  )
}