'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FormField, SaveButton, Alert, DeadlineNoticeAsync } from '@/components/ui'
import { FileUploadField } from '@/components/ui/FileUploadField'
import { useFormSave, useFormValidation, useFileUploadV2 } from '@/hooks'
import type { Entry, ProgramInfo } from '@/lib/types'
import { logger } from '@/lib/logger'

interface ProgramInfoFormProps {
  entry: Entry
}

export default function ProgramInfoForm({ entry }: ProgramInfoFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [programInfo, setProgramInfo] = useState<Partial<ProgramInfo>>({
    entry_id: entry.id,
    song_count: '1曲'
  })
  
  // 表示用の署名付きURL（パスとは別に管理）
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})

  // バリデーションルール（静的に定義）
  const validationRules = {
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
    semifinal_image4_path: { required: true },
    // 2曲の場合の追加ルール（条件付きで適用）
    final_player_photo_path: { 
      required: programInfo.song_count === '2曲',
      custom: (value: unknown) => {
        if (programInfo.song_count === '2曲' && !value) {
          return 'この項目は必須です'
        }
        return true
      }
    },
    final_story: { 
      required: programInfo.song_count === '2曲',
      maxLength: 100,
      custom: (value: unknown) => {
        if (programInfo.song_count === '2曲') {
          const strValue = String(value || '').trim()
          if (!strValue) return 'この項目は必須です'
          if (strValue.length > 100) return '100文字以内で入力してください'
        }
        return true
      }
    },
    final_highlight: { 
      required: programInfo.song_count === '2曲',
      maxLength: 50,
      custom: (value: unknown) => {
        if (programInfo.song_count === '2曲') {
          const strValue = String(value || '').trim()
          if (!strValue) return 'この項目は必須です'
          if (strValue.length > 50) return '50文字以内で入力してください'
        }
        return true
      }
    },
    final_image1_path: { 
      required: programInfo.song_count === '2曲',
      custom: (value: unknown) => {
        if (programInfo.song_count === '2曲' && !value) {
          return 'この項目は必須です'
        }
        return true
      }
    },
    final_image2_path: { 
      required: programInfo.song_count === '2曲',
      custom: (value: unknown) => {
        if (programInfo.song_count === '2曲' && !value) {
          return 'この項目は必須です'
        }
        return true
      }
    },
    final_image3_path: { 
      required: programInfo.song_count === '2曲',
      custom: (value: unknown) => {
        if (programInfo.song_count === '2曲' && !value) {
          return 'この項目は必須です'
        }
        return true
      }
    },
    final_image4_path: { 
      required: programInfo.song_count === '2曲',
      custom: (value: unknown) => {
        if (programInfo.song_count === '2曲' && !value) {
          return 'この項目は必須です'
        }
        return true
      }
    }
  }

  const { errors, validateSingleField } = useFormValidation(programInfo, validationRules)

  // フォーム保存フック
  const { save, saving, error, success, setError, setSuccess } = useFormSave({
    tableName: 'program_info',
    uniqueField: 'entry_id',
    redirectPath: undefined,
    onSuccess: (message) => setSuccess(message),
    onError: (error) => setError(error)
  })

  // ファイルアップロードフック
  const { uploadImage, uploading } = useFileUploadV2({
    category: 'image',
    onSuccess: (result: { field?: string; url?: string; path?: string }) => {
      // pathのみを使用（URLではなく相対パス）
      if (result.field && result.path) {
        setProgramInfo(prev => ({
          ...prev,
          [result.field as string]: result.path
        }))
      }
    },
    onError: (error: string) => setError(error)
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
        // 画像フィールドの署名付きURLを取得
        const imageFields = [
          'player_photo_path',
          'semifinal_image1_path', 'semifinal_image2_path', 'semifinal_image3_path', 'semifinal_image4_path',
          'final_player_photo_path',
          'final_image1_path', 'final_image2_path', 'final_image3_path', 'final_image4_path'
        ]
        
        const urls: Record<string, string> = {}
        
        for (const field of imageFields) {
          const fieldValue = (data as Record<string, unknown>)[field] as string
          if (fieldValue) {
            // 既にURLの場合はスキップ（https://で始まる場合）
            if (fieldValue.startsWith('https://') || fieldValue.startsWith('http://')) {
              logger.warn(`Field ${field} contains URL instead of path: ${fieldValue}`)
              // URLの場合は空にする（再アップロードが必要）
              ;(data as Record<string, unknown>)[field] = null
            } else {
              // 相対パスの場合のみ署名付きURLを生成
              try {
                const { data: urlData, error: urlError } = await supabase.storage
                  .from('files')
                  .createSignedUrl(fieldValue, 3600)
                
                if (urlError) {
                  logger.error(`Error creating signed URL for ${field}`, urlError)
                  // エラーの場合はnullにする
                  ;(data as Record<string, unknown>)[field] = null
                } else if (urlData?.signedUrl) {
                  urls[field] = urlData.signedUrl
                }
              } catch (err) {
                logger.error(`Exception creating signed URL for ${field}`, err)
                ;(data as Record<string, unknown>)[field] = null
              }
            }
          }
        }
        
        setProgramInfo(data)
        setImageUrls(urls)
      }
    } catch (err) {
      logger.error('プログラム情報の読み込みエラー', err, {
        action: 'load_program_info',
        entryId: entry.id
      })
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const result = await uploadImage(file, { userId: user.id, entryId: entry.id, field, folder: 'program' })
    
    // pathを使用して保存（URLではなく相対パス）
    if (result.success && result.path) {
      setProgramInfo(prev => ({ ...prev, [field]: result.path }))
      
      // 表示用の署名付きURLを生成
      const { data: urlData } = await supabase.storage
        .from('files')
        .createSignedUrl(result.path, 3600)
      
      if (urlData?.signedUrl) {
        setImageUrls(prev => ({ ...prev, [field]: urlData.signedUrl }))
      }
    }
  }
  
  const handleImageDelete = async (field: string) => {
    if (!window.confirm('画像を削除してもよろしいですか？')) return
    
    const path = (programInfo as Record<string, unknown>)[field] as string
    if (!path) return
    
    try {
      // ストレージから削除
      const { error } = await supabase.storage
        .from('files')
        .remove([path])
      
      if (error) {
        logger.error(`Error deleting image ${field}`, error)
        setError('画像の削除に失敗しました')
        return
      }
      
      // 状態を更新
      setProgramInfo(prev => ({ ...prev, [field]: null }))
      setImageUrls(prev => {
        const newUrls = { ...prev }
        delete newUrls[field]
        return newUrls
      })
      
      setSuccess('画像を削除しました')
    } catch (err) {
      logger.error(`Exception deleting image ${field}`, err)
      setError('画像の削除に失敗しました')
    }
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)

    // バリデーションはステータスチェック用のみ（保存は常に可能）

    // 保存するデータを準備（URLではなくパスのみを保存）
    const dataToSave = { ...programInfo, entry_id: entry.id }
    const imageFields = [
      'player_photo_path',
      'semifinal_image1_path', 'semifinal_image2_path', 'semifinal_image3_path', 'semifinal_image4_path',
      'final_player_photo_path',
      'final_image1_path', 'final_image2_path', 'final_image3_path', 'final_image4_path'
    ]
    
    // 画像フィールドがURLの場合はnullにする（相対パスのみ保存）
    for (const field of imageFields) {
      const value = (dataToSave as Record<string, unknown>)[field] as string
      if (value && (value.startsWith('https://') || value.startsWith('http://') || value.includes('supabase'))) {
        // 署名付きURLやpublicURLの場合はnullにする
        ;(dataToSave as Record<string, unknown>)[field] = null
      }
    }

    await save(dataToSave)

    // 保存成功後にダッシュボードにリダイレクト
    setSuccess('プログラム情報を保存しました')
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 1500)
  }

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">プログラム掲載用情報</h3>

      <DeadlineNoticeAsync deadlineKey="program_info_deadline" />

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
            <FileUploadField
              label="選手紹介用画像"
              required
              value={imageUrls.player_photo_path || programInfo.player_photo_path}
              onChange={(file) => handleImageUpload('player_photo_path', file)}
              onDelete={() => handleImageDelete('player_photo_path')}
              category="image"
              disabled={uploading}
              maxSizeMB={100}
              accept="image/*"
            />
            {errors.player_photo_path && (
              <p className="mt-1 text-sm text-red-600">{errors.player_photo_path}</p>
            )}
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium mb-2">画像についての要件：</p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 必要枚数：1枚</li>
                <li>• 服装：大会用衣装または競技衣装</li>
                <li>• サイズ：原寸で解像度300～350dpi以上が好ましい</li>
                <li>• 背景：正方形サイズに切り抜くので、背景の指定なし</li>
                <li>• 向き：二人の顔が正面を向いていること（推奨）</li>
                <li className="font-medium">※基本的に、腰から上の画像にカットします。</li>
              </ul>
            </div>
          </div>

          {/* あらすじ・ストーリー */}
          <FormField
            label="作品あらすじ・ストーリー（100文字以内）"
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
            label="作品見所（50文字以内）"
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
            {[1, 2, 3, 4].map((num) => {
              const fieldName = `semifinal_image${num}_path` as keyof ProgramInfo
              return (
                <div key={fieldName}>
                  <FileUploadField
                    label={`作品イメージ${num === 1 ? '①' : num === 2 ? '②' : num === 3 ? '③' : '④'}`}
                    required
                    value={imageUrls[fieldName] || (programInfo[fieldName] as string)}
                    onChange={(file) => handleImageUpload(fieldName, file)}
                    onDelete={() => handleImageDelete(fieldName)}
                    category="image"
                    disabled={uploading}
                    maxSizeMB={100}
                    accept="image/*"
                  />
                  {errors[fieldName] && (
                    <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
                  )}
                </div>
              )
            })}
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
              <FileUploadField
                label="選手紹介用画像"
                required
                value={imageUrls.final_player_photo_path || programInfo.final_player_photo_path}
                onChange={(file) => handleImageUpload('final_player_photo_path', file)}
                onDelete={() => handleImageDelete('final_player_photo_path')}
                category="image"
                disabled={uploading}
                maxSizeMB={100}
                accept="image/*"
              />
              {errors.final_player_photo_path && (
                <p className="mt-1 text-sm text-red-600">{errors.final_player_photo_path}</p>
              )}
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800 font-medium mb-2">画像についての要件：</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 必要枚数：1枚</li>
                  <li>• 服装：大会用衣装または競技衣装</li>
                  <li>• サイズ：原寸で解像度300～350dpi以上が好ましい</li>
                  <li>• 背景：正方形サイズに切り抜くので、背景の指定なし</li>
                  <li>• 向き：二人の顔が正面を向いていること（推奨）</li>
                  <li className="font-medium">※基本的に、腰から上の画像にカットします。</li>
                </ul>
              </div>
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
              {[1, 2, 3, 4].map((num) => {
                const fieldName = `final_image${num}_path` as keyof ProgramInfo
                return (
                  <div key={fieldName}>
                    <FileUploadField
                      label={`作品イメージ${num === 1 ? '①' : num === 2 ? '②' : num === 3 ? '③' : '④'}`}
                      required
                      value={imageUrls[fieldName] || (programInfo[fieldName] as string)}
                      onChange={(file) => handleImageUpload(fieldName, file)}
                      onDelete={() => handleImageDelete(fieldName)}
                      category="image"
                      disabled={uploading}
                      maxSizeMB={100}
                      accept="image/*"
                      />
                    {errors[fieldName] && (
                      <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
                    )}
                  </div>
                )
              })}
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
        <SaveButton
          onClick={handleSave}
          disabled={saving || uploading}
          loading={saving}
        />
      </div>
    </div>
  )
}