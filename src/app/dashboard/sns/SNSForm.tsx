'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { FormField, TemporarySaveButton, SaveButton, CancelButton, Alert, VideoUpload } from '@/components/ui'
import { useFormSave, useFormValidation, useFileUpload } from '@/hooks'
import type { Entry, SnsInfo as SNSInfo } from '@/lib/types'

interface SNSFormProps {
  userId: string
  entry: Entry | null
}

export default function SNSForm({ entry }: SNSFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [snsInfo, setSnsInfo] = useState<Partial<SNSInfo>>({
    entry_id: entry?.id || '',
    practice_video_path: '',
    practice_video_filename: '',
    introduction_highlight_path: '',
    introduction_highlight_filename: '',
    sns_notes: ''
  })

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

  const { errors, validateAll, isAllRequiredFieldsValid } = useFormValidation(snsInfo, validationRules)

  // フォーム保存フック
  const { save, saving, error, success, setError } = useFormSave({
    tableName: 'sns_info',
    uniqueField: 'entry_id',
    redirectPath: '/dashboard',
    onSuccess: (message) => showToast(message, 'success'),
    onError: (error) => showToast(error, 'error')
  })

  // ファイルアップロードフック
  const { uploadVideo, uploading } = useFileUpload({
    onSuccess: (url, field) => {
      if (field) {
        setSnsInfo(prev => ({
          ...prev,
          [`${field}_path`]: url
        }))
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
          setSnsInfo(snsData)
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [entry?.id, supabase, setError])

  const handleFileUpload = async (field: 'practice_video' | 'introduction_highlight', file: File) => {
    if (!entry?.id) {
      showToast('基本情報を先に保存してください', 'error')
      return
    }

    // ファイル名を保存
    setSnsInfo(prev => ({
      ...prev,
      [`${field}_filename`]: file.name
    }))

    // 古いファイルを削除（存在する場合）
    const pathField = `${field}_path` as keyof SNSInfo
    const oldPath = snsInfo[pathField]
    if (oldPath && typeof oldPath === 'string') {
      const oldFileName = oldPath.split('/').pop()
      if (oldFileName) {
        try {
          await supabase.storage
            .from('files')
            .remove([`${entry.id}/sns/${oldFileName}`])
        } catch (err) {
          console.error('古いファイルの削除エラー:', err)
        }
      }
    }

    // 新しいファイルをアップロード
    await uploadVideo(file, entry.id, field)
  }

  const handleFieldChange = (field: string, value: string) => {
    setSnsInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async (isTemporary = false) => {
    if (!entry?.id) {
      showToast('基本情報を先に保存してください', 'error')
      router.push('/dashboard/basic-info')
      return
    }

    // 完了保存の場合はバリデーション
    if (!isTemporary) {
      if (!validateAll(snsInfo)) {
        return
      }
    }

    await save({
      ...snsInfo,
      entry_id: entry.id
    }, isTemporary)
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
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

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
          value={snsInfo.practice_video_path}
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
          value={snsInfo.introduction_highlight_path}
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
        value={snsInfo.sns_notes || ''}
        onChange={(e) => handleFieldChange('sns_notes', e.target.value)}
        rows={4}
        placeholder="SNS掲載に関する希望や注意事項があれば記入してください"
      />

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          ※ アップロードいただいた動画は、大会公式SNSでの告知や結果発表時に使用させていただく場合があります。
        </p>
      </div>

      <div className="flex justify-between pt-6">
        <CancelButton onClick={() => router.push('/dashboard')} />
        <div className="space-x-4">
          <TemporarySaveButton
            onClick={() => handleSave(true)}
            disabled={saving || uploading || !entry}
            loading={saving}
          />
          <SaveButton
            onClick={() => handleSave(false)}
            disabled={saving || uploading || !entry || !isAllRequiredFieldsValid(snsInfo)}
            loading={saving}
          />
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