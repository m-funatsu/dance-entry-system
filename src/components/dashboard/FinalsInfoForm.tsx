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
  const [musicChangeOption, setMusicChangeOption] = useState<'changed' | 'unchanged' | ''>('')
  const [soundChangeOption, setSoundChangeOption] = useState<'same' | 'different' | ''>('')
  const [lightingChangeOption, setLightingChangeOption] = useState<'same' | 'different' | ''>('')
  const [choreographerChangeOption, setChoreographerChangeOption] = useState<'same' | 'different' | ''>('')
  const [finalsInfo, setFinalsInfo] = useState<Partial<FinalsInfo>>({
    entry_id: entry.id,
    music_change: false,
    copyright_permission: '',
    sound_change_from_semifinals: false,
    lighting_change_from_semifinals: false,
    choreographer_change: false,
    choreographer_attendance: '',
    choreographer_photo_permission: ''
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
        .maybeSingle()

      if (error) {
        // PGRST116は「No rows found」エラー（正常）
        if (error.code !== 'PGRST116') {
          console.error('Supabase error:', error)
          throw error
        }
      }

      if (data) {
        setFinalsInfo(data)
        // music_changeの値に基づいてmusicChangeOptionを設定
        if (data.music_change === false && data.music_title) {
          setMusicChangeOption('unchanged')
        } else if (data.music_change === true) {
          setMusicChangeOption('changed')
        }
        // sound_change_from_semifinalsの値に基づいてsoundChangeOptionを設定
        if (data.sound_change_from_semifinals === false && data.sound_start_timing) {
          setSoundChangeOption('same')
        } else if (data.sound_change_from_semifinals === true) {
          setSoundChangeOption('different')
        }
        // lighting_change_from_semifinalsの値に基づいてlightingChangeOptionを設定
        if (data.lighting_change_from_semifinals === false && data.dance_start_timing) {
          setLightingChangeOption('same')
        } else if (data.lighting_change_from_semifinals === true) {
          setLightingChangeOption('different')
        }
        // choreographer_changeの値に基づいてchoreographerChangeOptionを設定
        if (data.choreographer_change === false && data.choreographer_name) {
          setChoreographerChangeOption('same')
        } else if (data.choreographer_change === true) {
          setChoreographerChangeOption('different')
        }
      }
    } catch (err) {
      console.error('決勝情報の読み込みエラー:', err)
      console.error('エラー詳細:', JSON.stringify(err))
      setError(`決勝情報の読み込みに失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMusicChangeOption = async (option: 'changed' | 'unchanged') => {
    setMusicChangeOption(option)
    setError(null)
    setSuccess(null)
    
    if (option === 'unchanged') {
      // 準決勝からデータをコピー
      try {
        const { data: semifinalsData } = await supabase
          .from('semifinals_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()

        if (semifinalsData) {
          setFinalsInfo(prev => ({
            ...prev,
            music_change: false,
            work_title: semifinalsData.work_title,
            work_character_story: semifinalsData.work_character_story,
            copyright_permission: semifinalsData.copyright_permission,
            music_title: semifinalsData.music_title,
            artist: semifinalsData.artist,
            cd_title: semifinalsData.cd_title,
            record_number: semifinalsData.record_number,
            jasrac_code: semifinalsData.jasrac_code,
            music_type: semifinalsData.music_type,
            music_data_path: semifinalsData.music_data_path
          }))
          setSuccess('準決勝の楽曲情報をコピーしました')
        } else {
          setError('準決勝情報が見つかりません')
        }
      } catch (err) {
        console.error('準決勝情報の読み込みエラー:', err)
        setError('準決勝情報の読み込みに失敗しました')
      }
    } else if (option === 'changed') {
      // 変更ありの場合はフィールドをクリア
      setFinalsInfo(prev => ({
        ...prev,
        music_change: true,
        work_title: '',
        work_character_story: '',
        copyright_permission: '',
        music_title: '',
        artist: '',
        cd_title: '',
        record_number: '',
        jasrac_code: '',
        music_type: '',
        music_data_path: ''
      }))
    }
  }

  const handleSoundChangeOption = async (option: 'same' | 'different') => {
    setSoundChangeOption(option)
    setError(null)
    setSuccess(null)
    
    if (option === 'same') {
      // 準決勝から音響指示データをコピー
      try {
        const { data: semifinalsData } = await supabase
          .from('semifinals_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()

        if (semifinalsData) {
          setFinalsInfo(prev => ({
            ...prev,
            sound_change_from_semifinals: false,
            sound_start_timing: semifinalsData.sound_start_timing,
            chaser_song_designation: semifinalsData.chaser_song_designation,
            chaser_song: semifinalsData.chaser_song,
            fade_out_start_time: semifinalsData.fade_out_start_time,
            fade_out_complete_time: semifinalsData.fade_out_complete_time
          }))
          setSuccess('準決勝の音響指示情報をコピーしました')
        } else {
          setError('準決勝情報が見つかりません')
        }
      } catch (err) {
        console.error('準決勝情報の読み込みエラー:', err)
        setError('準決勝情報の読み込みに失敗しました')
      }
    } else if (option === 'different') {
      // 異なる音響指示の場合はフィールドをクリア
      setFinalsInfo(prev => ({
        ...prev,
        sound_change_from_semifinals: true,
        sound_start_timing: '',
        chaser_song_designation: '',
        chaser_song: '',
        fade_out_start_time: '',
        fade_out_complete_time: ''
      }))
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
        .maybeSingle()

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

  const handleLightingChangeOption = async (option: 'same' | 'different') => {
    setLightingChangeOption(option)
    setError(null)
    setSuccess(null)
    
    if (option === 'same') {
      // 準決勝から照明指示データをコピー
      try {
        const { data: semifinalsData } = await supabase
          .from('semifinals_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()

        if (semifinalsData) {
          setFinalsInfo(prev => ({
            ...prev,
            lighting_change_from_semifinals: false,
            dance_start_timing: semifinalsData.dance_start_timing,
            scene1_time: semifinalsData.scene1_time,
            scene1_trigger: semifinalsData.scene1_trigger,
            scene1_color_type: semifinalsData.scene1_color_type,
            scene1_color_other: semifinalsData.scene1_color_other,
            scene1_image: semifinalsData.scene1_image,
            scene1_image_path: semifinalsData.scene1_image_path,
            scene1_notes: semifinalsData.scene1_notes,
            scene2_time: semifinalsData.scene2_time,
            scene2_trigger: semifinalsData.scene2_trigger,
            scene2_color_type: semifinalsData.scene2_color_type,
            scene2_color_other: semifinalsData.scene2_color_other,
            scene2_image: semifinalsData.scene2_image,
            scene2_image_path: semifinalsData.scene2_image_path,
            scene2_notes: semifinalsData.scene2_notes,
            scene3_time: semifinalsData.scene3_time,
            scene3_trigger: semifinalsData.scene3_trigger,
            scene3_color_type: semifinalsData.scene3_color_type,
            scene3_color_other: semifinalsData.scene3_color_other,
            scene3_image: semifinalsData.scene3_image,
            scene3_image_path: semifinalsData.scene3_image_path,
            scene3_notes: semifinalsData.scene3_notes,
            scene4_time: semifinalsData.scene4_time,
            scene4_trigger: semifinalsData.scene4_trigger,
            scene4_color_type: semifinalsData.scene4_color_type,
            scene4_color_other: semifinalsData.scene4_color_other,
            scene4_image: semifinalsData.scene4_image,
            scene4_image_path: semifinalsData.scene4_image_path,
            scene4_notes: semifinalsData.scene4_notes,
            scene5_time: semifinalsData.scene5_time,
            scene5_trigger: semifinalsData.scene5_trigger,
            scene5_color_type: semifinalsData.scene5_color_type,
            scene5_color_other: semifinalsData.scene5_color_other,
            scene5_image: semifinalsData.scene5_image,
            scene5_image_path: semifinalsData.scene5_image_path,
            scene5_notes: semifinalsData.scene5_notes,
            chaser_exit_time: semifinalsData.chaser_exit_time,
            chaser_exit_trigger: semifinalsData.chaser_exit_trigger,
            chaser_exit_color_type: semifinalsData.chaser_exit_color_type,
            chaser_exit_color_other: semifinalsData.chaser_exit_color_other,
            chaser_exit_image: semifinalsData.chaser_exit_image,
            chaser_exit_image_path: semifinalsData.chaser_exit_image_path,
            chaser_exit_notes: semifinalsData.chaser_exit_notes
          }))
          setSuccess('準決勝の照明指示情報をコピーしました')
        } else {
          setError('準決勝情報が見つかりません')
        }
      } catch (err) {
        console.error('準決勝情報の読み込みエラー:', err)
        setError('準決勝情報の読み込みに失敗しました')
      }
    } else if (option === 'different') {
      // 異なる照明指示の場合はフィールドをクリア
      setFinalsInfo(prev => ({
        ...prev,
        lighting_change_from_semifinals: true,
        dance_start_timing: '',
        scene1_time: '',
        scene1_trigger: '',
        scene1_color_type: '',
        scene1_color_other: '',
        scene1_image: '',
        scene1_image_path: '',
        scene1_notes: '',
        scene2_time: '',
        scene2_trigger: '',
        scene2_color_type: '',
        scene2_color_other: '',
        scene2_image: '',
        scene2_image_path: '',
        scene2_notes: '',
        scene3_time: '',
        scene3_trigger: '',
        scene3_color_type: '',
        scene3_color_other: '',
        scene3_image: '',
        scene3_image_path: '',
        scene3_notes: '',
        scene4_time: '',
        scene4_trigger: '',
        scene4_color_type: '',
        scene4_color_other: '',
        scene4_image: '',
        scene4_image_path: '',
        scene4_notes: '',
        scene5_time: '',
        scene5_trigger: '',
        scene5_color_type: '',
        scene5_color_other: '',
        scene5_image: '',
        scene5_image_path: '',
        scene5_notes: '',
        chaser_exit_time: '',
        chaser_exit_trigger: '',
        chaser_exit_color_type: '',
        chaser_exit_color_other: '',
        chaser_exit_image: '',
        chaser_exit_image_path: '',
        chaser_exit_notes: ''
      }))
    }
  }

  const handleChoreographerChangeOption = async (option: 'same' | 'different') => {
    setChoreographerChangeOption(option)
    setError(null)
    setSuccess(null)
    
    if (option === 'same') {
      // 準決勝から振付師データをコピー
      try {
        const { data: semifinalsData } = await supabase
          .from('semifinals_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()

        if (semifinalsData) {
          setFinalsInfo(prev => ({
            ...prev,
            choreographer_change: false,
            choreographer_name: semifinalsData.choreographer_name,
            choreographer_name_kana: semifinalsData.choreographer_name_kana
          }))
          setSuccess('準決勝の振付師情報をコピーしました')
        } else {
          setError('準決勝情報が見つかりません')
        }
      } catch (err) {
        console.error('準決勝情報の読み込みエラー:', err)
        setError('準決勝情報の読み込みに失敗しました')
      }
    } else if (option === 'different') {
      // 異なる振付師の場合はフィールドをクリア
      setFinalsInfo(prev => ({
        ...prev,
        choreographer_change: true,
        choreographer_name: '',
        choreographer_name_kana: ''
      }))
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
      setSuccess('ファイルがアップロードされました')
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              楽曲情報の変更 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="music_change_option"
                  value="unchanged"
                  checked={musicChangeOption === 'unchanged'}
                  onChange={() => handleMusicChangeOption('unchanged')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                準決勝から変更なし
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="music_change_option"
                  value="changed"
                  checked={musicChangeOption === 'changed'}
                  onChange={() => handleMusicChangeOption('changed')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                準決勝から変更あり
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品タイトルまたはテーマ
            </label>
            <input
              type="text"
              value={finalsInfo.work_title || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, work_title: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                musicChangeOption === 'unchanged' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={musicChangeOption === 'unchanged'}
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
              disabled={musicChangeOption === 'unchanged'}
            />
            <div className="text-sm text-gray-500 mt-1">
              {finalsInfo.work_character_story?.length || 0}/50文字
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              楽曲著作権許諾 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className={`flex items-center ${musicChangeOption === 'unchanged' ? 'text-gray-400' : ''}`}>
                <input
                  type="radio"
                  name="copyright_permission"
                  value="commercial"
                  checked={finalsInfo.copyright_permission === 'commercial'}
                  onChange={() => setFinalsInfo(prev => ({ ...prev, copyright_permission: 'commercial' }))}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  disabled={musicChangeOption === 'unchanged'}
                />
                A.市販の楽曲を使用する
              </label>
              <label className={`flex items-center ${musicChangeOption === 'unchanged' ? 'text-gray-400' : ''}`}>
                <input
                  type="radio"
                  name="copyright_permission"
                  value="licensed"
                  checked={finalsInfo.copyright_permission === 'licensed'}
                  onChange={() => setFinalsInfo(prev => ({ ...prev, copyright_permission: 'licensed' }))}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  disabled={musicChangeOption === 'unchanged'}
                />
                B.自身で著作権に対し許諾を取った楽曲を使用する
              </label>
              <label className={`flex items-center ${musicChangeOption === 'unchanged' ? 'text-gray-400' : ''}`}>
                <input
                  type="radio"
                  name="copyright_permission"
                  value="original"
                  checked={finalsInfo.copyright_permission === 'original'}
                  onChange={() => setFinalsInfo(prev => ({ ...prev, copyright_permission: 'original' }))}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  disabled={musicChangeOption === 'unchanged'}
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
              value={finalsInfo.music_title || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, music_title: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                musicChangeOption === 'unchanged' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={musicChangeOption === 'unchanged'}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                musicChangeOption === 'unchanged' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={musicChangeOption === 'unchanged'}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                musicChangeOption === 'unchanged' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={musicChangeOption === 'unchanged'}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                musicChangeOption === 'unchanged' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={musicChangeOption === 'unchanged'}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                musicChangeOption === 'unchanged' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={musicChangeOption === 'unchanged'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              楽曲種類
            </label>
            <select
              value={finalsInfo.music_type || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, music_type: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                musicChangeOption === 'unchanged' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={musicChangeOption === 'unchanged'}
            >
              <option value="">選択してください</option>
              <option value="CD楽曲">CD楽曲</option>
              <option value="データダウンロード楽曲">データダウンロード楽曲</option>
              <option value="その他（オリジナル曲）">その他（オリジナル曲）</option>
            </select>
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                musicChangeOption === 'unchanged' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={musicChangeOption === 'unchanged'}
            />
            {finalsInfo.music_data_path && (
              <div className="mt-2 text-sm text-gray-600">
                アップロード済み
              </div>
            )}
          </div>

        </div>
      )}

      {/* 音響指示情報セクション */}
      {activeSection === 'sound' && (
        <div className="space-y-4">
          <h4 className="font-medium">音響指示情報</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              準決勝との音響指示 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sound_change_option"
                  value="same"
                  checked={soundChangeOption === 'same'}
                  onChange={() => handleSoundChangeOption('same')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                準決勝と同じ音響指示
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sound_change_option"
                  value="different"
                  checked={soundChangeOption === 'different'}
                  onChange={() => handleSoundChangeOption('different')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                準決勝と異なる音響指示
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音楽スタートのタイミング（きっかけ、ポーズなど）
            </label>
            <input
              type="text"
              value={finalsInfo.sound_start_timing || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, sound_start_timing: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                soundChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={soundChangeOption === 'same'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              チェイサー（退場）曲の指定
            </label>
            <select
              value={finalsInfo.chaser_song_designation || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_song_designation: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                soundChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={soundChangeOption === 'same'}
            >
              <option value="">選択してください</option>
              <option value="自作曲に組み込み">自作曲に組み込み</option>
              <option value="必要">必要</option>
              <option value="不要（無音）">不要（無音）</option>
            </select>
          </div>

          {finalsInfo.chaser_song_designation === '必要' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                チェイサー（退場）曲 音源
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload('chaser_song', file)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={soundChangeOption === 'same'}
              />
              {finalsInfo.chaser_song && (
                <div className="mt-2 text-sm text-gray-600">
                  アップロード済み
                </div>
              )}
            </div>
          )}

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
              disabled={soundChangeOption === 'same'}
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
              disabled={soundChangeOption === 'same'}
            />
          </div>
        </div>
      )}

      {/* 照明指示情報セクション */}
      {activeSection === 'lighting' && (
        <div className="space-y-6">
          <h4 className="font-medium">照明指示情報</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              準決勝との照明指示変更の有無 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="lighting_change_option"
                  value="same"
                  checked={lightingChangeOption === 'same'}
                  onChange={() => handleLightingChangeOption('same')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                準決勝と同じ照明指示
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="lighting_change_option"
                  value="different"
                  checked={lightingChangeOption === 'different'}
                  onChange={() => handleLightingChangeOption('different')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                準決勝と異なる照明指示
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              決勝 - 踊り出しタイミング
            </label>
            <input
              type="text"
              value={finalsInfo.dance_start_timing || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, dance_start_timing: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={lightingChangeOption === 'same'}
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
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                    }`}
                    disabled={lightingChangeOption === 'same'}
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
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                    }`}
                    disabled={lightingChangeOption === 'same'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    色・系統
                  </label>
                  <select
                    value={finalsInfo[`scene${sceneNum}_color_type` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_color_type`]: e.target.value }))}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                    }`}
                    disabled={lightingChangeOption === 'same'}
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
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                    }`}
                    disabled={lightingChangeOption === 'same'}
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
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                    }`}
                    disabled={lightingChangeOption === 'same'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    イメージ画像
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      id={`scene${sceneNum}_image_input`}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(`scene${sceneNum}_image_path`, file)
                      }}
                      className="hidden"
                      disabled={lightingChangeOption === 'same'}
                    />
                    <label
                      htmlFor={`scene${sceneNum}_image_input`}
                      className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        lightingChangeOption === 'same' 
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                          : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        クリックして画像を選択
                      </span>
                    </label>
                    {finalsInfo[`scene${sceneNum}_image_path` as keyof FinalsInfo] && (
                      <div className="mt-2 text-sm text-green-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        アップロード済み
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    備考
                  </label>
                  <textarea
                    value={finalsInfo[`scene${sceneNum}_notes` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_notes`]: e.target.value }))}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                    }`}
                    disabled={lightingChangeOption === 'same'}
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
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                  }`}
                  disabled={lightingChangeOption === 'same'}
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
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                  }`}
                  disabled={lightingChangeOption === 'same'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  色・系統
                </label>
                <select
                  value={finalsInfo.chaser_exit_color_type || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_color_type: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                  }`}
                  disabled={lightingChangeOption === 'same'}
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
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                  }`}
                  disabled={lightingChangeOption === 'same'}
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
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                  }`}
                  disabled={lightingChangeOption === 'same'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イメージ画像
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    id="chaser_exit_image_input"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload('chaser_exit_image_path', file)
                    }}
                    className="hidden"
                    disabled={lightingChangeOption === 'same'}
                  />
                  <label
                    htmlFor="chaser_exit_image_input"
                    className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      lightingChangeOption === 'same' 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                        : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      クリックして画像を選択
                    </span>
                  </label>
                  {finalsInfo.chaser_exit_image_path && (
                    <div className="mt-2 text-sm text-green-600 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      アップロード済み
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  value={finalsInfo.chaser_exit_notes || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_notes: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    lightingChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
                  }`}
                  disabled={lightingChangeOption === 'same'}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              振付師の変更 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="choreographer_change_option"
                  value="same"
                  checked={choreographerChangeOption === 'same'}
                  onChange={() => handleChoreographerChangeOption('same')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                準決勝と同じ振付師
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="choreographer_change_option"
                  value="different"
                  checked={choreographerChangeOption === 'different'}
                  onChange={() => handleChoreographerChangeOption('different')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                準決勝とは異なる振付師
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              決勝 - 振付師
            </label>
            <input
              type="text"
              value={finalsInfo.choreographer_name || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer_name: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                choreographerChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={choreographerChangeOption === 'same'}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                choreographerChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={choreographerChangeOption === 'same'}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                choreographerChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={choreographerChangeOption === 'same'}
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
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                choreographerChangeOption === 'same' ? 'bg-gray-300 cursor-not-allowed' : ''
              }`}
              disabled={choreographerChangeOption === 'same'}
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">作品振付師出席情報</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作品振付師出席予定 <span className="text-red-500">*</span>
                </label>
                <select
                  value={finalsInfo.choreographer_attendance || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer_attendance: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  <option value="振付師本人が当日会場で席について観戦する">振付師本人が当日会場で席について観戦する</option>
                  <option value="振付師本人が当日会場にいる（役員・選手等）">振付師本人が当日会場にいる（役員・選手等）</option>
                  <option value="振付師の代理人が当日会場で席について観戦する">振付師の代理人が当日会場で席について観戦する</option>
                  <option value="振付師の代理人が当日会場にいる（役員等）">振付師の代理人が当日会場にいる（役員等）</option>
                  <option value="欠席する">欠席する</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作品振付師写真掲載 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="choreographer_photo_permission"
                      value="希望する"
                      checked={finalsInfo.choreographer_photo_permission === '希望する'}
                      onChange={() => setFinalsInfo(prev => ({ ...prev, choreographer_photo_permission: '希望する' }))}
                      className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    希望する
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="choreographer_photo_permission"
                      value="希望しない"
                      checked={finalsInfo.choreographer_photo_permission === '希望しない'}
                      onChange={() => setFinalsInfo(prev => ({ ...prev, choreographer_photo_permission: '希望しない' }))}
                      className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    希望しない
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                作品振付師写真
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  id="choreographer_photo_input"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload('choreographer_photo_path', file)
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="choreographer_photo_input"
                  className="flex items-center justify-center px-6 py-3 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer transition-all hover:border-indigo-500 hover:bg-indigo-50 bg-gradient-to-br from-indigo-50 to-purple-50"
                >
                  <svg className="w-6 h-6 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-base font-medium text-indigo-600">
                    クリックして写真を選択
                  </span>
                </label>
                {finalsInfo.choreographer_photo_path && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-green-700">写真がアップロードされました</span>
                  </div>
                )}
              </div>
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