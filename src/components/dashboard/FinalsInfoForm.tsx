'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Entry, FinalsInfo } from '@/lib/types'

interface FinalsInfoFormProps {
  entry: Entry
}

export default function FinalsInfoForm({ entry }: FinalsInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('music')
  const [finalsInfo, setFinalsInfo] = useState<Partial<FinalsInfo>>({
    entry_id: entry.id,
    music_change: false,
    copy_preliminary_music: false,
    copyright_permission: '',
    sound_change_from_semifinals: false,
    lighting_change_from_semifinals: false,
    choreographer_change: false,
    choreographer_attendance: false,
    choreographer_photo_permission: false
  })

  useEffect(() => {
    loadFinalsInfo()
  }, [entry.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadFinalsInfo = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('finals_info')
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
        setFinalsInfo(data)
      }
    } catch (err) {
      console.error('決勝情報の読み込みエラー:', err)
      console.error('エラー詳細:', JSON.stringify(err))
      setError(`決勝情報の読み込みに失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyPreliminaryMusic = async () => {
    try {
      const { data: preliminaryData } = await supabase
        .from('preliminary_info')
        .select('*')
        .eq('entry_id', entry.id)
        .single()

      if (preliminaryData) {
        setFinalsInfo(prev => ({
          ...prev,
          work_title: preliminaryData.work_title,
          music_title: preliminaryData.music_title,
          artist: preliminaryData.artist,
          cd_title: preliminaryData.cd_title,
          record_number: preliminaryData.record_number,
          jasrac_code: preliminaryData.jasrac_code,
          music_type: preliminaryData.music_type
        }))
        setSuccess('予選楽曲情報をコピーしました')
      }
    } catch (err) {
      console.error('予選情報の読み込みエラー:', err)
      setError('予選情報の読み込みに失敗しました')
    }
  }

  const handleSave = async (isTemporary = false) => {
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      // 50文字制限のチェック
      if (finalsInfo.work_character_story && finalsInfo.work_character_story.length > 50) {
        throw new Error('作品キャラクター・ストーリー等は50文字以内で入力してください')
      }

      const { data: existingData } = await supabase
        .from('finals_info')
        .select('id')
        .eq('entry_id', entry.id)
        .single()

      if (existingData) {
        // 更新
        const { error } = await supabase
          .from('finals_info')
          .update({
            ...finalsInfo,
            updated_at: new Date().toISOString()
          })
          .eq('entry_id', entry.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('finals_info')
          .insert({
            ...finalsInfo,
            entry_id: entry.id
          })

        if (error) throw error
      }

      setSuccess(isTemporary ? '決勝情報を一時保存しました' : '決勝情報を保存しました')
      router.refresh()
    } catch (err) {
      console.error('保存エラー:', err)
      setError(err instanceof Error ? err.message : '決勝情報の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (field: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${entry.id}/finals/${field}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      setFinalsInfo(prev => ({
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
    { id: 'choreographer', label: '振付変更情報・作品振付師出席情報' }
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
      <h3 className="text-lg font-semibold">決勝情報</h3>

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
        <div className="space-y-4">
          <h4 className="font-medium">楽曲情報</h4>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={finalsInfo.music_change || false}
                onChange={(e) => setFinalsInfo(prev => ({ ...prev, music_change: e.target.checked }))}
                className="mr-2"
              />
              楽曲情報の変更
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={finalsInfo.copy_preliminary_music || false}
                onChange={(e) => setFinalsInfo(prev => ({ ...prev, copy_preliminary_music: e.target.checked }))}
                className="mr-2"
              />
              予選の楽曲情報をコピー
            </label>
            {finalsInfo.copy_preliminary_music && (
              <button
                onClick={handleCopyPreliminaryMusic}
                className="px-4 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
              >
                コピー実行
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品タイトルまたはテーマ
            </label>
            <input
              type="text"
              value={finalsInfo.work_title || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, work_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品キャラクター・ストーリー等（50字以内）
            </label>
            <textarea
              value={finalsInfo.work_character_story || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, work_character_story: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              maxLength={50}
            />
            <div className="text-sm text-gray-500 mt-1">
              {finalsInfo.work_character_story?.length || 0}/50文字
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={finalsInfo.copyright_permission || false}
                onChange={(e) => setFinalsInfo(prev => ({ ...prev, copyright_permission: e.target.checked }))}
                className="mr-2"
              />
              楽曲著作権許諾
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              使用楽曲タイトル
            </label>
            <input
              type="text"
              value={finalsInfo.music_title || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, music_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              収録CDタイトル
            </label>
            <input
              type="text"
              value={finalsInfo.cd_title || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, cd_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アーティスト
            </label>
            <input
              type="text"
              value={finalsInfo.artist || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, artist: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              レコード番号
            </label>
            <input
              type="text"
              value={finalsInfo.record_number || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, record_number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JASRAC作品コード
            </label>
            <input
              type="text"
              value={finalsInfo.jasrac_code || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, jasrac_code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              楽曲種類
            </label>
            <input
              type="text"
              value={finalsInfo.music_type || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, music_type: e.target.value }))}
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
            {finalsInfo.music_data_path && (
              <div className="mt-2 text-sm text-gray-600">
                アップロード済み
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音源使用方法
            </label>
            <textarea
              value={finalsInfo.music_usage_method || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, music_usage_method: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* 音響指示情報セクション */}
      {activeSection === 'sound' && (
        <div className="space-y-4">
          <h4 className="font-medium">音響指示情報</h4>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={finalsInfo.sound_change_from_semifinals || false}
                onChange={(e) => setFinalsInfo(prev => ({ ...prev, sound_change_from_semifinals: e.target.checked }))}
                className="mr-2"
              />
              準決勝との音響指示変更の有無
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音楽スタートのタイミング（きっかけ、ポーズなど）
            </label>
            <input
              type="text"
              value={finalsInfo.sound_start_timing || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, sound_start_timing: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              チェイサー（退場）曲の指定
            </label>
            <input
              type="text"
              value={finalsInfo.chaser_song_designation || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_song_designation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              チェイサー（退場）曲
            </label>
            <input
              type="text"
              value={finalsInfo.chaser_song || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_song: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フェードアウト開始時間
            </label>
            <input
              type="text"
              value={finalsInfo.fade_out_start_time || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, fade_out_start_time: e.target.value }))}
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
              value={finalsInfo.fade_out_complete_time || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, fade_out_complete_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例：4:00"
            />
          </div>
        </div>
      )}

      {/* 照明指示情報セクション */}
      {activeSection === 'lighting' && (
        <div className="space-y-6">
          <h4 className="font-medium">照明指示情報</h4>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={finalsInfo.lighting_change_from_semifinals || false}
                onChange={(e) => setFinalsInfo(prev => ({ ...prev, lighting_change_from_semifinals: e.target.checked }))}
                className="mr-2"
              />
              準決勝との照明指示変更の有無
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              決勝 - 踊り出しタイミング
            </label>
            <input
              type="text"
              value={finalsInfo.dance_start_timing || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, dance_start_timing: e.target.value }))}
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
                    value={finalsInfo[`scene${sceneNum}_time` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_time`]: e.target.value }))}
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
                    value={finalsInfo[`scene${sceneNum}_trigger` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_trigger`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    色・系統
                  </label>
                  <select
                    value={finalsInfo[`scene${sceneNum}_color_type` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_color_type`]: e.target.value }))}
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
                    value={finalsInfo[`scene${sceneNum}_color_other` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_color_other`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    イメージ
                  </label>
                  <input
                    type="text"
                    value={finalsInfo[`scene${sceneNum}_image` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_image`]: e.target.value }))}
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
                    value={finalsInfo[`scene${sceneNum}_notes` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_notes`]: e.target.value }))}
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
                  value={finalsInfo.chaser_exit_time || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  きっかけ
                </label>
                <input
                  type="text"
                  value={finalsInfo.chaser_exit_trigger || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_trigger: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  色・系統
                </label>
                <select
                  value={finalsInfo.chaser_exit_color_type || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_color_type: e.target.value }))}
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
                  value={finalsInfo.chaser_exit_color_other || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_color_other: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イメージ
                </label>
                <input
                  type="text"
                  value={finalsInfo.chaser_exit_image || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_image: e.target.value }))}
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
                  value={finalsInfo.chaser_exit_notes || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 振付変更情報・作品振付師出席情報セクション */}
      {activeSection === 'choreographer' && (
        <div className="space-y-6">
          <h4 className="font-medium">振付変更情報</h4>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={finalsInfo.choreographer_change || false}
                onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer_change: e.target.checked }))}
                className="mr-2"
              />
              振付師の変更
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              決勝 - 振付師
            </label>
            <input
              type="text"
              value={finalsInfo.choreographer_name || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              決勝 - 振付師（かな）
            </label>
            <input
              type="text"
              value={finalsInfo.choreographer_name_kana || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer_name_kana: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              決勝 - 振付師2（決勝でダンサーが振付変更した場合）
            </label>
            <input
              type="text"
              value={finalsInfo.choreographer2_name || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer2_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              決勝 - 振付師2（かな）
            </label>
            <input
              type="text"
              value={finalsInfo.choreographer2_name_kana || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer2_name_kana: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">作品振付師出席情報</h4>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={finalsInfo.choreographer_attendance || false}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer_attendance: e.target.checked }))}
                  className="mr-2"
                />
                作品振付師出席予定
              </label>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={finalsInfo.choreographer_photo_permission || false}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer_photo_permission: e.target.checked }))}
                  className="mr-2"
                />
                作品振付師写真掲載
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作品振付師写真
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload('choreographer_photo_path', file)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              {finalsInfo.choreographer_photo_path && (
                <div className="mt-2 text-sm text-gray-600">
                  アップロード済み
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}