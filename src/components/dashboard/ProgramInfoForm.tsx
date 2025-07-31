'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Entry, ProgramInfo } from '@/lib/types'
import ImageUpload from '@/components/ui/ImageUpload'

interface ProgramInfoFormProps {
  entry: Entry
}

export default function ProgramInfoForm({ entry }: ProgramInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [programInfo, setProgramInfo] = useState<Partial<ProgramInfo>>({
    entry_id: entry.id,
    song_count: '1曲',
    player_photo_type: ''
  })

  // 必須項目が全て入力されているかチェック
  const isAllRequiredFieldsValid = () => {
    // 基本的な必須項目
    if (!programInfo.player_photo_type) return false
    if (!programInfo.player_photo_path) return false
    if (!programInfo.semifinal_story || !programInfo.semifinal_story.trim()) return false
    if (!programInfo.semifinal_highlight || !programInfo.semifinal_highlight.trim()) return false
    if (!programInfo.semifinal_image1_path || !programInfo.semifinal_image2_path || 
        !programInfo.semifinal_image3_path || !programInfo.semifinal_image4_path) return false

    // 2曲の場合の追加必須項目
    if (programInfo.song_count === '2曲') {
      if (!programInfo.final_player_photo_path) return false
      if (!programInfo.final_story || !programInfo.final_story.trim()) return false
      if (!programInfo.final_highlight || !programInfo.final_highlight.trim()) return false
      if (!programInfo.final_image1_path || !programInfo.final_image2_path || 
          !programInfo.final_image3_path || !programInfo.final_image4_path) return false
    }

    return true
  }

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
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        // player_photo_typeが未設定の場合はデフォルト値を設定
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

  const handleSave = async (isTemporary = false) => {
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      // 一時保存でない場合のみ必須項目をチェック
      if (!isTemporary) {
        // 必須項目のチェック
        if (!programInfo.player_photo_type) {
          throw new Error('選手紹介用写真の種類を選択してください')
        }
        if (!programInfo.player_photo_path) {
          throw new Error('選手紹介用画像をアップロードしてください')
        }
        if (!programInfo.semifinal_story || programInfo.semifinal_story.trim() === '') {
          throw new Error('作品目あらすじ・ストーリーを入力してください')
        }
        if (!programInfo.semifinal_highlight || programInfo.semifinal_highlight.trim() === '') {
          throw new Error('作品目見所を入力してください')
        }
        if (!programInfo.semifinal_image1_path || !programInfo.semifinal_image2_path || 
            !programInfo.semifinal_image3_path || !programInfo.semifinal_image4_path) {
          throw new Error('作品目作品イメージ①〜④をすべてアップロードしてください')
        }

        // 2曲の場合の追加必須項目チェック
        if (programInfo.song_count === '2曲') {
          if (!programInfo.final_player_photo_path) {
            throw new Error('決勝用の選手紹介用画像をアップロードしてください')
          }
          if (!programInfo.final_story || programInfo.final_story.trim() === '') {
            throw new Error('決勝のあらすじ・ストーリーを入力してください')
          }
          if (!programInfo.final_highlight || programInfo.final_highlight.trim() === '') {
            throw new Error('決勝の見所を入力してください')
          }
          if (!programInfo.final_image1_path || !programInfo.final_image2_path || 
              !programInfo.final_image3_path || !programInfo.final_image4_path) {
            throw new Error('決勝の作品イメージ①〜④をすべてアップロードしてください')
          }
        }
      }

      // 100文字制限のチェック
      if (programInfo.semifinal_story && programInfo.semifinal_story.length > 100) {
        throw new Error('準決勝のあらすじ・ストーリーは100文字以内で入力してください')
      }
      if (programInfo.final_story && programInfo.final_story.length > 100) {
        throw new Error('決勝のあらすじ・ストーリーは100文字以内で入力してください')
      }

      // 50文字制限のチェック
      if (programInfo.semifinal_highlight && programInfo.semifinal_highlight.length > 50) {
        throw new Error('準決勝の見所は50文字以内で入力してください')
      }
      if (programInfo.final_highlight && programInfo.final_highlight.length > 50) {
        throw new Error('決勝の見所は50文字以内で入力してください')
      }

      const { data: existingData } = await supabase
        .from('program_info')
        .select('id')
        .eq('entry_id', entry.id)
        .single()

      if (existingData) {
        // 更新
        const { error } = await supabase
          .from('program_info')
          .update({
            ...programInfo,
            updated_at: new Date().toISOString()
          })
          .eq('entry_id', entry.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('program_info')
          .insert({
            ...programInfo,
            entry_id: entry.id
          })

        if (error) throw error
      }

      setSuccess(isTemporary ? 'プログラム掲載用情報を一時保存しました' : 'プログラム掲載用情報を保存しました')
      router.refresh()
    } catch (err) {
      console.error('保存エラー:', err)
      setError(err instanceof Error ? err.message : 'プログラム掲載用情報の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (field: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${entry.id}/${field}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      setProgramInfo(prev => ({
        ...prev,
        [field]: publicUrl
      }))
    } catch (err) {
      console.error('画像アップロードエラー:', err)
      setError('画像のアップロードに失敗しました')
    }
  }

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">プログラム掲載用情報</h3>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* 楽曲数 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            楽曲数
          </label>
          <select
            value={programInfo.song_count || '1曲'}
            onChange={(e) => setProgramInfo(prev => ({ ...prev, song_count: e.target.value as '1曲' | '2曲' }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="1曲">1曲（準決勝と決勝で同じ楽曲を使用する）</option>
            <option value="2曲">2曲（準決勝と決勝で異なる楽曲を使用する）</option>
          </select>
        </div>

        {/* 選手紹介用写真の種類 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            選手紹介用写真の種類 <span className="text-red-500">*</span>
          </label>
          <select
            value={programInfo.player_photo_type || ''}
            onChange={(e) => setProgramInfo(prev => ({ ...prev, player_photo_type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">選択してください</option>
            <option value="Freedom's CUP撮影会での写真">Freedom&apos;s CUP撮影会での写真</option>
            <option value="お持ちのデータを使用">お持ちのデータを使用</option>
          </select>
        </div>

        {/* 準決勝用情報 */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">
            {programInfo.song_count === '1曲' ? '決勝・準決勝用情報' : '準決勝用情報'}
          </h4>
          
          {/* 所属教室または所属 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所属教室または所属（任意）
            </label>
            <input
              type="text"
              value={programInfo.affiliation || ''}
              onChange={(e) => setProgramInfo(prev => ({ ...prev, affiliation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* 選手紹介用画像 */}
          <div className="mb-4">
            <ImageUpload
              label="選手紹介用画像"
              required
              value={programInfo.player_photo_path}
              onChange={(file) => handleImageUpload('player_photo_path', file)}
            />
          </div>

          {/* あらすじ・ストーリー */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品目あらすじ・ストーリー（100文字以内） <span className="text-red-500">*</span>
            </label>
            <textarea
              value={programInfo.semifinal_story || ''}
              onChange={(e) => setProgramInfo(prev => ({ ...prev, semifinal_story: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              maxLength={100}
            />
            <div className="text-sm text-gray-500 mt-1">
              {programInfo.semifinal_story?.length || 0}/100文字
            </div>
          </div>

          {/* 見所 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品目見所（50文字以内） <span className="text-red-500">*</span>
            </label>
            <textarea
              value={programInfo.semifinal_highlight || ''}
              onChange={(e) => setProgramInfo(prev => ({ ...prev, semifinal_highlight: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              maxLength={50}
            />
            <div className="text-sm text-gray-500 mt-1">
              {programInfo.semifinal_highlight?.length || 0}/50文字
            </div>
          </div>

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
              </div>
            ))}
          </div>
        </div>

        {/* 決勝用情報（2曲の場合のみ表示） */}
        {programInfo.song_count === '2曲' && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">決勝用情報</h4>
            
            {/* 所属教室または所属 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                所属教室または所属（任意）
              </label>
              <input
                type="text"
                value={programInfo.final_affiliation || ''}
                onChange={(e) => setProgramInfo(prev => ({ ...prev, final_affiliation: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* 選手紹介用画像 */}
            <div className="mb-4">
              <ImageUpload
                label="選手紹介用画像"
                required
                value={programInfo.final_player_photo_path}
                onChange={(file) => handleImageUpload('final_player_photo_path', file)}
              />
            </div>

            {/* あらすじ・ストーリー */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作品目あらすじ・ストーリー（100文字以内） <span className="text-red-500">*</span>
              </label>
              <textarea
                value={programInfo.final_story || ''}
                onChange={(e) => setProgramInfo(prev => ({ ...prev, final_story: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                maxLength={100}
              />
              <div className="text-sm text-gray-500 mt-1">
                {programInfo.final_story?.length || 0}/100文字
              </div>
            </div>

            {/* 見所 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作品目見所（50文字以内） <span className="text-red-500">*</span>
              </label>
              <textarea
                value={programInfo.final_highlight || ''}
                onChange={(e) => setProgramInfo(prev => ({ ...prev, final_highlight: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
                maxLength={50}
              />
              <div className="text-sm text-gray-500 mt-1">
                {programInfo.final_highlight?.length || 0}/50文字
              </div>
            </div>

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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 備考欄 */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            備考欄
          </label>
          <textarea
            value={programInfo.notes || ''}
            onChange={(e) => setProgramInfo(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={4}
            placeholder="その他の連絡事項があれば記入してください"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          className={`px-6 py-2 rounded-md text-white ${
            saving
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {saving ? '一時保存中...' : '一時保存'}
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={saving || !isAllRequiredFieldsValid()}
          className={`px-6 py-2 rounded-md text-white ${
            saving || !isAllRequiredFieldsValid()
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}