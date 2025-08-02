'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FormField, TemporarySaveButton, SaveButton, Alert, ImageUpload } from '@/components/ui'
import { useFormSave, useFormValidation, useFileUpload } from '@/hooks'
import type { Entry, ProgramInfo } from '@/lib/types'

interface ProgramInfoFormProps {
  entry: Entry
}

export default function ProgramInfoForm({ entry }: ProgramInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [programInfo, setProgramInfo] = useState<Partial<ProgramInfo>>({
    entry_id: entry.id,
    song_count: '1曲',
    player_photo_type: ''
  })

  // バリデーションルール（動的に変更される）
  const getValidationRules = () => {
    const rules: Record<string, unknown> = {
      player_photo_type: { required: true },
      player_photo_path: { required: true },
      semifinal_story: { 
        required: true,
        maxLength: 100,
        custom: (value: unknown) => {
          const strValue = String(value || '').trim()
          if (!strValue) return 'この項目は必須です'
          if (strValue.length > 100) return '100文字以内で入力してください'
          return true
        }
      },
      semifinal_highlight: { 
        required: true,
        maxLength: 50,
        custom: (value: unknown) => {
          const strValue = String(value || '').trim()
          if (!strValue) return 'この項目は必須です'
          if (strValue.length > 50) return '50文字以内で入力してください'
          return true
        }
      },
      semifinal_image1_path: { required: true },
      semifinal_image2_path: { required: true },
      semifinal_image3_path: { required: true },
      semifinal_image4_path: { required: true }
    }

    // 2曲の場合の追加ルール
    if (programInfo.song_count === '2曲') {
      rules.final_player_photo_path = { required: true }
      rules.final_story = { 
        required: true,
        maxLength: 100,
        custom: (value: unknown) => {
          const strValue = String(value || '').trim()
          if (!strValue) return 'この項目は必須です'
          if (strValue.length > 100) return '100文字以内で入力してください'
          return true
        }
      }
      rules.final_highlight = { 
        required: true,
        maxLength: 50,
        custom: (value: unknown) => {
          const strValue = String(value || '').trim()
          if (!strValue) return 'この項目は必須です'
          if (strValue.length > 50) return '50文字以内で入力してください'
          return true
        }
      }
      rules.final_image1_path = { required: true }
      rules.final_image2_path = { required: true }
      rules.final_image3_path = { required: true }
      rules.final_image4_path = { required: true }
    }

    return rules
  }

  const { errors, validateAll, validateSingleField, isAllRequiredFieldsValid } = useFormValidation(programInfo, getValidationRules())

  // フォーム保存フック
  const { save, saving, error, success, setError, setSuccess } = useFormSave({
    tableName: 'program_info',
    uniqueField: 'entry_id',
    redirectPath: undefined,
    onSuccess: (message) => setSuccess(message),
    onError: (error) => setError(error)
  })

  // ファイルアップロードフック
  const { uploadImage, uploading } = useFileUpload({
    onSuccess: (url, field) => {
      if (field) {
        setProgramInfo(prev => ({
          ...prev,
          [field]: url
        }))
      }
    },
    onError: (error) => setError(error)
  })

  useEffect(() => {
    loadProgramInfo()
  }, [entry.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadProgramInfo = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('program_info')
        .select('*')
        .eq('entry_id', entry.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setProgramInfo({
          ...data,
          player_photo_type: data.player_photo_type || ''
        })
      }
    } catch (err) {
      console.error('プログラム情報の読み込みエラー:', err)
      setError('プログラム情報の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: string | boolean) => {
    setProgramInfo(prev => ({ ...prev, [field]: value }))
    validateSingleField(field, value)
  }

  const handleImageUpload = async (field: string, file: File) => {
    await uploadImage(file, entry.id, field)
  }

  const handleSave = async (isTemporary = false) => {
    setError(null)
    setSuccess(null)

    // 完了保存の場合はバリデーション
    if (!isTemporary) {
      if (!validateAll(programInfo)) {
        setError('入力内容に誤りがあります')
        return
      }
    }

    await save({
      ...programInfo,
      entry_id: entry.id
    }, isTemporary)

    router.refresh()
  }

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">プログラム掲載用情報</h3>

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="space-y-4">
        {/* 楽曲数 */}
        <FormField
          label="楽曲数"
          name="song_count"
          type="select"
          value={programInfo.song_count || '1曲'}
          onChange={(e) => handleFieldChange('song_count', e.target.value)}
        >
          <option value="1曲">1曲（準決勝と決勝で同じ楽曲を使用する）</option>
          <option value="2曲">2曲（準決勝と決勝で異なる楽曲を使用する）</option>
        </FormField>

        {/* 選手紹介用写真の種類 */}
        <FormField
          label="選手紹介用写真の種類"
          name="player_photo_type"
          type="select"
          value={programInfo.player_photo_type || ''}
          onChange={(e) => handleFieldChange('player_photo_type', e.target.value)}
          required
          error={errors.player_photo_type}
        >
          <option value="">選択してください</option>
          <option value="Freedom's CUP撮影会での写真">Freedom&apos;s CUP撮影会での写真</option>
          <option value="お持ちのデータを使用">お持ちのデータを使用</option>
        </FormField>

        {/* 準決勝用情報 */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">
            {programInfo.song_count === '1曲' ? '決勝・準決勝用情報' : '準決勝用情報'}
          </h4>
          
          {/* 所属教室または所属 */}
          <FormField
            label="所属教室または所属（任意）"
            name="affiliation"
            value={programInfo.affiliation || ''}
            onChange={(e) => handleFieldChange('affiliation', e.target.value)}
          />

          {/* 選手紹介用画像 */}
          <div className="mb-4">
            <ImageUpload
              label="選手紹介用画像"
              required
              value={programInfo.player_photo_path}
              onChange={(file) => handleImageUpload('player_photo_path', file)}
            />
            {errors.player_photo_path && (
              <p className="mt-1 text-sm text-red-600">{errors.player_photo_path}</p>
            )}
          </div>

          {/* あらすじ・ストーリー */}
          <FormField
            label="作品目あらすじ・ストーリー（100文字以内）"
            name="semifinal_story"
            type="textarea"
            value={programInfo.semifinal_story || ''}
            onChange={(e) => handleFieldChange('semifinal_story', e.target.value)}
            required
            maxLength={100}
            rows={3}
            error={errors.semifinal_story}
          />

          {/* 見所 */}
          <FormField
            label="作品目見所（50文字以内）"
            name="semifinal_highlight"
            type="textarea"
            value={programInfo.semifinal_highlight || ''}
            onChange={(e) => handleFieldChange('semifinal_highlight', e.target.value)}
            required
            maxLength={50}
            rows={2}
            error={errors.semifinal_highlight}
          />

          {/* 作品イメージ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((num) => (
              <div key={`semifinal_image${num}`}>
                <ImageUpload
                  label={`作品目作品イメージ${num === 1 ? '①' : num === 2 ? '②' : num === 3 ? '③' : '④'}`}
                  required
                  value={programInfo[`semifinal_image${num}_path` as keyof ProgramInfo] as string}
                  onChange={(file) => handleImageUpload(`semifinal_image${num}_path`, file)}
                />
                {errors[`semifinal_image${num}_path`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`semifinal_image${num}_path`]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 決勝用情報（2曲の場合のみ表示） */}
        {programInfo.song_count === '2曲' && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">決勝用情報</h4>
            
            {/* 所属教室または所属 */}
            <FormField
              label="所属教室または所属（任意）"
              name="final_affiliation"
              value={programInfo.final_affiliation || ''}
              onChange={(e) => handleFieldChange('final_affiliation', e.target.value)}
            />

            {/* 選手紹介用画像 */}
            <div className="mb-4">
              <ImageUpload
                label="選手紹介用画像"
                required
                value={programInfo.final_player_photo_path}
                onChange={(file) => handleImageUpload('final_player_photo_path', file)}
              />
              {errors.final_player_photo_path && (
                <p className="mt-1 text-sm text-red-600">{errors.final_player_photo_path}</p>
              )}
            </div>

            {/* あらすじ・ストーリー */}
            <FormField
              label="作品目あらすじ・ストーリー（100文字以内）"
              name="final_story"
              type="textarea"
              value={programInfo.final_story || ''}
              onChange={(e) => handleFieldChange('final_story', e.target.value)}
              required
              maxLength={100}
              rows={3}
              error={errors.final_story}
            />

            {/* 見所 */}
            <FormField
              label="作品目見所（50文字以内）"
              name="final_highlight"
              type="textarea"
              value={programInfo.final_highlight || ''}
              onChange={(e) => handleFieldChange('final_highlight', e.target.value)}
              required
              maxLength={50}
              rows={2}
              error={errors.final_highlight}
            />

            {/* 作品イメージ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={`final_image${num}`}>
                  <ImageUpload
                    label={`作品目作品イメージ${num === 1 ? '①' : num === 2 ? '②' : num === 3 ? '③' : '④'}`}
                    required
                    value={programInfo[`final_image${num}_path` as keyof ProgramInfo] as string}
                    onChange={(file) => handleImageUpload(`final_image${num}_path`, file)}
                  />
                  {errors[`final_image${num}_path`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`final_image${num}_path`]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 備考欄 */}
        <div className="border-t pt-4">
          <FormField
            label="備考欄"
            name="notes"
            type="textarea"
            value={programInfo.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            rows={4}
            placeholder="その他の連絡事項があれば記入してください"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <TemporarySaveButton
          onClick={() => handleSave(true)}
          disabled={saving || uploading}
          loading={saving}
        />
        <SaveButton
          onClick={() => handleSave(false)}
          disabled={saving || uploading || !isAllRequiredFieldsValid(programInfo)}
          loading={saving}
        />
      </div>
    </div>
  )
}