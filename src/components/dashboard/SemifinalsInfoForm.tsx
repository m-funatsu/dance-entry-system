'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Entry, SemifinalsInfo } from '@/lib/types'

interface SemifinalsInfoFormProps {
  entry: Entry
}

export default function SemifinalsInfoForm({ entry }: SemifinalsInfoFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('music')
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [semifinalsInfo, setSemifinalsInfo] = useState<Partial<SemifinalsInfo>>({
    entry_id: entry.id,
    music_change_from_preliminary: false,
    copyright_permission: '',
    choreographer_change_from_preliminary: false
  })

  useEffect(() => {
    loadSemifinalsInfo()
  }, [entry.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSemifinalsInfo = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('semifinals_info')
        .select('*')
        .eq('entry_id', entry.id)
        .single()

      if (error) {
        // PGRST116は「No rows found」エラー（正常）
        if (error.code !== 'PGRST116') {
          console.error('Supabase error:', error)
          throw error
        }
      }

      if (data) {
        if (isInitialLoad) {
          // 初回読み込み時のみデータを設定
          setSemifinalsInfo(data)
          setIsInitialLoad(false)
        }
        // 初回以降は現在の入力を保持
      }
    } catch (err) {
      console.error('準決勝情報の読み込みエラー:', err)
      console.error('エラー詳細:', JSON.stringify(err))
      setError(`準決勝情報の読み込みに失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (isTemporary = false) => {
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      // 50文字制限のチェック
      if (semifinalsInfo.work_character_story && semifinalsInfo.work_character_story.length > 50) {
        throw new Error('作品キャラクター・ストーリー等は50文字以内で入力してください')
      }

      const { data: existingData } = await supabase
        .from('semifinals_info')
        .select('id')
        .eq('entry_id', entry.id)
        .single()

      if (existingData) {
        // 更新
        const { error } = await supabase
          .from('semifinals_info')
          .update({
            ...semifinalsInfo,
            updated_at: new Date().toISOString()
          })
          .eq('entry_id', entry.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('semifinals_info')
          .insert({
            ...semifinalsInfo,
            entry_id: entry.id
          })

        if (error) throw error
      }

      setSuccess(isTemporary ? '準決勝情報を一時保存しました' : '準決勝情報を保存しました')
      // データを保持するため、再読み込みはしない
    } catch (err) {
      console.error('保存エラー:', err)
      setError(err instanceof Error ? err.message : '準決勝情報の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (field: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${entry.id}/semifinals/${field}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      setSemifinalsInfo(prev => ({
        ...prev,
        [field]: publicUrl
      }))
    } catch (err) {
      console.error('ファイルアップロードエラー:', err)
      setError('ファイルのアップロードに失敗しました')
    }
  }

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  const sections = [
    { id: 'music', label: '楽曲情報' },
    { id: 'sound', label: '音響指示情報' },
    { id: 'lighting', label: '照明指示情報' },
    { id: 'choreographer', label: '振付情報' },
    { id: 'bank', label: '賞金振込先情報' }
  ]

  const colorTypes = [
    '赤系',
    '青系',
    '緑系',
    '黄系',
    '紫系',
    '白系',
    '暖色系',
    '寒色系',
    'その他'
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">準決勝情報</h3>

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

      {/* セクションタブ */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 楽曲情報セクション */}
      {activeSection === 'music' && (
        <>
          <div className="space-y-4">
            <h4 className="font-medium">楽曲情報</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予選との楽曲情報の変更 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="music_change_option"
                  value="true"
                  checked={semifinalsInfo.music_change_from_preliminary === true}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, music_change_from_preliminary: true }))}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                変更あり
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="music_change_option"
                  value="false"
                  checked={semifinalsInfo.music_change_from_preliminary === false}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, music_change_from_preliminary: false }))}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                変更なし
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品タイトルまたはテーマ
            </label>
            <input
              type="text"
              value={semifinalsInfo.work_title || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, work_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品キャラクター・ストーリー等（50字以内）
            </label>
            <textarea
              value={semifinalsInfo.work_character_story || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, work_character_story: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              maxLength={50}
            />
            <div className="text-sm text-gray-500 mt-1">
              {semifinalsInfo.work_character_story?.length || 0}/50文字
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              楽曲著作権許諾
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="copyright_permission"
                  value="commercial"
                  checked={semifinalsInfo.copyright_permission === 'commercial'}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, copyright_permission: 'commercial' }))}
                  className="mr-2"
                />
                A.市販の楽曲を使用する
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="copyright_permission"
                  value="licensed"
                  checked={semifinalsInfo.copyright_permission === 'licensed'}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, copyright_permission: 'licensed' }))}
                  className="mr-2"
                />
                B.自身で著作権に対し許諾を取った楽曲を使用する
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="copyright_permission"
                  value="original"
                  checked={semifinalsInfo.copyright_permission === 'original'}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, copyright_permission: 'original' }))}
                  className="mr-2"
                />
                C.独自に製作されたオリジナル楽曲を使用する
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              使用楽曲タイトル
            </label>
            <input
              type="text"
              value={semifinalsInfo.music_title || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, music_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              収録CDタイトル
            </label>
            <input
              type="text"
              value={semifinalsInfo.cd_title || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, cd_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アーティスト
            </label>
            <input
              type="text"
              value={semifinalsInfo.artist || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, artist: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              レコード番号
            </label>
            <input
              type="text"
              value={semifinalsInfo.record_number || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, record_number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JASRAC作品コード
            </label>
            <input
              type="text"
              value={semifinalsInfo.jasrac_code || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, jasrac_code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              楽曲種類
            </label>
            <input
              type="text"
              value={semifinalsInfo.music_type || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, music_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              楽曲データ
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload('music_data_path', file)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {semifinalsInfo.music_data_path && (
              <div className="mt-2 text-sm text-gray-600">
                アップロード済み
              </div>
            )}
          </div>

          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end pt-6 space-x-4">
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? '一時保存中...' : '一時保存'}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </>
      )}

      {/* 音響指示情報セクション */}
      {activeSection === 'sound' && (
        <>
          <div className="space-y-4">
            <h4 className="font-medium">音響指示情報</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音楽スタートのタイミング（きっかけ、ポーズなど）
            </label>
            <input
              type="text"
              value={semifinalsInfo.sound_start_timing || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, sound_start_timing: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              チェイサー（退場）曲の指定
            </label>
            <input
              type="text"
              value={semifinalsInfo.chaser_song_designation || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_song_designation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              チェイサー（退場）曲
            </label>
            <input
              type="text"
              value={semifinalsInfo.chaser_song || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_song: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フェードアウト開始時間
            </label>
            <input
              type="text"
              value={semifinalsInfo.fade_out_start_time || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, fade_out_start_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例：3:45"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フェードアウト完了時間
            </label>
            <input
              type="text"
              value={semifinalsInfo.fade_out_complete_time || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, fade_out_complete_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例：4:00"
            />
          </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end pt-6 space-x-4">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? '一時保存中...' : '一時保存'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          </div>
        </>
      )}

      {/* 照明指示情報セクション */}
      {activeSection === 'lighting' && (
        <>
          <div className="space-y-6">
          <h4 className="font-medium">照明指示情報</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              準決勝 - 踊り出しタイミング
            </label>
            <input
              type="text"
              value={semifinalsInfo.dance_start_timing || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, dance_start_timing: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* シーン1-5とチェイサー/退場 */}
          {[1, 2, 3, 4, 5].map((sceneNum) => (
            <div key={`scene${sceneNum}`} className="border-t pt-4">
              <h5 className="font-medium mb-3">シーン{sceneNum}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    時間
                  </label>
                  <input
                    type="text"
                    value={semifinalsInfo[`scene${sceneNum}_time` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_time`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="例：0:30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    きっかけ
                  </label>
                  <input
                    type="text"
                    value={semifinalsInfo[`scene${sceneNum}_trigger` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_trigger`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    色・系統
                  </label>
                  <select
                    value={semifinalsInfo[`scene${sceneNum}_color_type` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_color_type`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">選択してください</option>
                    {colorTypes.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    色・系統その他
                  </label>
                  <input
                    type="text"
                    value={semifinalsInfo[`scene${sceneNum}_color_other` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_color_other`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    イメージ
                  </label>
                  <input
                    type="text"
                    value={semifinalsInfo[`scene${sceneNum}_image` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_image`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    イメージ画像
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(`scene${sceneNum}_image_path`, file)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    備考
                  </label>
                  <textarea
                    value={semifinalsInfo[`scene${sceneNum}_notes` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_notes`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* チェイサー/退場 */}
          <div className="border-t pt-4">
            <h5 className="font-medium mb-3">チェイサー/退場</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  時間
                </label>
                <input
                  type="text"
                  value={semifinalsInfo.chaser_exit_time || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  きっかけ
                </label>
                <input
                  type="text"
                  value={semifinalsInfo.chaser_exit_trigger || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_trigger: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  色・系統
                </label>
                <select
                  value={semifinalsInfo.chaser_exit_color_type || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_color_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  {colorTypes.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  色・系統その他
                </label>
                <input
                  type="text"
                  value={semifinalsInfo.chaser_exit_color_other || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_color_other: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イメージ
                </label>
                <input
                  type="text"
                  value={semifinalsInfo.chaser_exit_image || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_image: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イメージ画像
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload('chaser_exit_image_path', file)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  value={semifinalsInfo.chaser_exit_notes || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                />
              </div>
            </div>
          </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end pt-6 space-x-4">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? '一時保存中...' : '一時保存'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          </div>
        </>
      )}

      {/* 振付情報セクション */}
      {activeSection === 'choreographer' && (
        <>
          <div className="space-y-4">
          <h4 className="font-medium">振付情報</h4>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={semifinalsInfo.choreographer_change_from_preliminary || false}
                onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, choreographer_change_from_preliminary: e.target.checked }))}
                className="mr-2"
              />
              予選との振付師の変更
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              準決勝 - 振付師
            </label>
            <input
              type="text"
              value={semifinalsInfo.choreographer_name || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, choreographer_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              準決勝 - 振付師（かな）
            </label>
            <input
              type="text"
              value={semifinalsInfo.choreographer_name_kana || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, choreographer_name_kana: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end pt-6 space-x-4">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? '一時保存中...' : '一時保存'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          </div>
        </>
      )}

      {/* 賞金振込先情報セクション */}
      {activeSection === 'bank' && (
        <>
          <div className="space-y-4">
          <h4 className="font-medium">賞金振込先情報</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              銀行名
            </label>
            <input
              type="text"
              value={semifinalsInfo.bank_name || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, bank_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支店名
            </label>
            <input
              type="text"
              value={semifinalsInfo.branch_name || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, branch_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              口座種類
            </label>
            <select
              value={semifinalsInfo.account_type || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, account_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">選択してください</option>
              <option value="普通">普通</option>
              <option value="当座">当座</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              口座番号
            </label>
            <input
              type="text"
              value={semifinalsInfo.account_number || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, account_number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              口座名義
            </label>
            <input
              type="text"
              value={semifinalsInfo.account_holder || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, account_holder: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end pt-6 space-x-4">
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? '一時保存中...' : '一時保存'}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}