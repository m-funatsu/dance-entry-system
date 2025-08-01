'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry, FinalsInfo, BasicInfo, PreliminaryInfo, SemifinalsInfo } from '@/lib/types'

interface FinalsFormProps {
  userId: string
  entry: Entry | null
}

// 楽曲ファイルアップロードコンポーネント
function MusicFileUpload({ 
  disabled, 
  value, 
  onChange 
}: { 
  disabled?: boolean
  value?: string
  onChange: (file: File) => void 
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
      if (file.type.startsWith('audio/')) {
        setUploadingFile(file)
        onChange(file)
      } else {
        alert('音声ファイルを選択してください')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
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
          accept="audio/*"
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
            {uploadingFile && (
              <p className="text-xs text-gray-600">
                {uploadingFile.name} ({formatFileSize(uploadingFile.size)})
              </p>
            )}
            {!disabled && (
              <p className="text-xs text-gray-500">クリックまたはドラッグ&ドロップで変更</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-sm font-medium text-gray-700">
              音楽ファイルをドラッグ&ドロップ
            </p>
            <p className="text-xs text-gray-500">
              または<span className="text-indigo-600">クリックして選択</span>
            </p>
            <p className="text-xs text-gray-400">
              対応形式: MP3, WAV, AAC, M4A など
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

export default function FinalsForm({ entry }: FinalsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null)
  const [preliminaryInfo, setPreliminaryInfo] = useState<PreliminaryInfo | null>(null)
  const [semifinalsInfo, setSemifinalsInfo] = useState<SemifinalsInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('music')
  
  const [finalsInfo, setFinalsInfo] = useState<Partial<FinalsInfo>>({
    entry_id: entry?.id || '',
    music_change: false,
    copy_preliminary_music: false,
    sound_change_from_semifinals: false,
    lighting_change_from_semifinals: false,
    choreographer_change: false,
    copyright_permission: ''
  })

  // データを読み込む
  useEffect(() => {
    if (!entry?.id) return
    
    const loadData = async () => {
      try {
        // 基本情報を取得
        const { data: basicData } = await supabase
          .from('basic_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()
        
        if (basicData) {
          setBasicInfo(basicData)
        }
        
        // 予選情報を取得
        const { data: prelimData } = await supabase
          .from('preliminary_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()
        
        if (prelimData) {
          setPreliminaryInfo(prelimData)
        }
        
        // 準決勝情報を取得
        const { data: semiData } = await supabase
          .from('semifinals_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()
        
        if (semiData) {
          setSemifinalsInfo(semiData)
        }
        
        // 決勝情報を取得
        const { data: finalsData, error: finalsError } = await supabase
          .from('finals_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()
        
        if (finalsError && finalsError.code !== 'PGRST116') {
          console.error('Error loading finals info:', finalsError)
        }
        
        if (finalsData) {
          setFinalsInfo(finalsData)
        } else {
          // 新規作成時の初期設定
          if (basicData) {
            // 基本情報から振付師情報をデフォルト設定
            setFinalsInfo(prev => ({
              ...prev,
              choreographer_name: basicData.choreographer || '',
              choreographer_name_kana: basicData.choreographer_furigana || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
        showToast('データの読み込みに失敗しました', 'error')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [entry?.id, supabase, showToast])

  // 楽曲変更ラジオボタンの処理
  const handleMusicChange = (changeType: 'none' | 'fromPreliminary' | 'new') => {
    if (changeType === 'none') {
      // 準決勝と同じ楽曲を使用
      setFinalsInfo(prev => ({
        ...prev,
        music_change: false,
        copy_preliminary_music: false,
        work_title: semifinalsInfo?.work_title || '',
        work_character_story: semifinalsInfo?.work_character_story || '',
        music_title: semifinalsInfo?.music_title || '',
        cd_title: semifinalsInfo?.cd_title || '',
        artist: semifinalsInfo?.artist || '',
        record_number: semifinalsInfo?.record_number || '',
        jasrac_code: semifinalsInfo?.jasrac_code || '',
        music_type: semifinalsInfo?.music_type || ''
      }))
    } else if (changeType === 'fromPreliminary') {
      // 予選と同じ楽曲を使用
      setFinalsInfo(prev => ({
        ...prev,
        music_change: true,
        copy_preliminary_music: true,
        work_title: preliminaryInfo?.work_title || '',
        work_character_story: preliminaryInfo?.work_story || '',
        music_title: preliminaryInfo?.music_title || '',
        cd_title: preliminaryInfo?.cd_title || '',
        artist: preliminaryInfo?.artist || '',
        record_number: preliminaryInfo?.record_number || '',
        jasrac_code: preliminaryInfo?.jasrac_code || '',
        music_type: preliminaryInfo?.music_type || ''
      }))
    } else {
      // 新しい楽曲を使用
      setFinalsInfo(prev => ({
        ...prev,
        music_change: true,
        copy_preliminary_music: false,
        work_title: '',
        work_character_story: '',
        music_title: '',
        cd_title: '',
        artist: '',
        record_number: '',
        jasrac_code: '',
        music_type: ''
      }))
    }
  }

  // 音響指示変更チェックボックスの処理
  const handleSoundChange = (checked: boolean) => {
    if (checked) {
      // チェックが入った場合：クリア
      setFinalsInfo(prev => ({
        ...prev,
        sound_change_from_semifinals: true,
        sound_start_timing: '',
        chaser_song_designation: '',
        chaser_song: '',
        fade_out_start_time: '',
        fade_out_complete_time: ''
      }))
    } else {
      // チェックが外れた場合：準決勝情報から復元
      setFinalsInfo(prev => ({
        ...prev,
        sound_change_from_semifinals: false,
        sound_start_timing: semifinalsInfo?.sound_start_timing || '',
        chaser_song_designation: semifinalsInfo?.chaser_song_designation || '',
        chaser_song: semifinalsInfo?.chaser_song || '',
        fade_out_start_time: semifinalsInfo?.fade_out_start_time || '',
        fade_out_complete_time: semifinalsInfo?.fade_out_complete_time || ''
      }))
    }
  }

  // 照明指示変更チェックボックスの処理
  const handleLightingChange = (checked: boolean) => {
    if (checked) {
      // チェックが入った場合：クリア
      setFinalsInfo(prev => ({
        ...prev,
        lighting_change_from_semifinals: true,
        dance_start_timing: ''
      }))
    } else {
      // チェックが外れた場合：準決勝情報から復元
      setFinalsInfo(prev => ({
        ...prev,
        lighting_change_from_semifinals: false,
        dance_start_timing: semifinalsInfo?.dance_start_timing || ''
      }))
    }
  }

  // 振付師変更チェックボックスの処理
  const handleChoreographerChange = (checked: boolean) => {
    if (checked) {
      // チェックが入った場合：クリア
      setFinalsInfo(prev => ({
        ...prev,
        choreographer_change: true,
        choreographer_name: '',
        choreographer_name_kana: '',
        choreographer2_name: '',
        choreographer2_name_kana: ''
      }))
    } else {
      // チェックが外れた場合：基本情報から復元
      setFinalsInfo(prev => ({
        ...prev,
        choreographer_change: false,
        choreographer_name: basicInfo?.choreographer || '',
        choreographer_name_kana: basicInfo?.choreographer_furigana || '',
        choreographer2_name: '',
        choreographer2_name_kana: ''
      }))
    }
  }

  const handleSave = async (isTemporary = false) => {
    setSaving(true)

    try {
      if (!entry?.id) {
        showToast('基本情報を先に保存してください', 'error')
        router.push('/dashboard/basic-info')
        return
      }

      // 必須項目チェック（一時保存時はスキップ）
      if (!isTemporary) {
        // 楽曲情報の必須項目チェック
        const requiredMusicFields = [
          { field: 'work_title', name: '作品タイトルまたはテーマ' },
          { field: 'work_character_story', name: '作品キャラクター・ストーリー等' },
          { field: 'copyright_permission', name: '楽曲著作権許諾' },
          { field: 'music_title', name: '使用楽曲タイトル' },
          { field: 'cd_title', name: '収録CDタイトル' },
          { field: 'artist', name: 'アーティスト' },
          { field: 'record_number', name: 'レコード番号' },
          { field: 'jasrac_code', name: 'JASRAC作品コード' },
          { field: 'music_type', name: '楽曲種類' },
          { field: 'music_data_path', name: '楽曲データ' }
        ]

        const missingFields = requiredMusicFields.filter(
          ({ field }) => !finalsInfo[field as keyof FinalsInfo]
        )

        if (missingFields.length > 0) {
          const fieldNames = missingFields.map(({ name }) => name).join('、')
          throw new Error(`以下の楽曲情報は必須項目です：${fieldNames}`)
        }

        // 音響指示情報の必須項目チェック
        const requiredSoundFields = [
          { field: 'sound_start_timing', name: '音楽スタートのタイミング' },
          { field: 'chaser_song_designation', name: 'チェイサー（退場）曲の指定' },
          { field: 'fade_out_start_time', name: 'フェードアウト開始時間' },
          { field: 'fade_out_complete_time', name: 'フェードアウト完了時間' }
        ]

        const missingSoundFields = requiredSoundFields.filter(
          ({ field }) => !finalsInfo[field as keyof FinalsInfo]
        )

        if (missingSoundFields.length > 0) {
          const fieldNames = missingSoundFields.map(({ name }) => name).join('、')
          throw new Error(`以下の音響指示情報は必須項目です：${fieldNames}`)
        }

        // チェイサー曲が「必要」の場合、音源も必須
        if (finalsInfo.chaser_song_designation === 'required' && !finalsInfo.chaser_song) {
          throw new Error('チェイサー（退場）曲音源をアップロードしてください')
        }

        // 照明指示情報の必須項目チェック
        const requiredLightingFields = [
          { field: 'dance_start_timing', name: '決勝 - 踊り出しタイミング' },
          { field: 'scene1_time', name: 'シーン1 - 時間' },
          { field: 'scene1_trigger', name: 'シーン1 - きっかけ' },
          { field: 'scene1_color_type', name: 'シーン1 - 色・系統' },
          { field: 'scene1_color_other', name: 'シーン1 - 色・系統その他' },
          { field: 'scene1_image', name: 'シーン1 - イメージ' },
          { field: 'scene1_image_path', name: 'シーン1 - イメージ画像' },
          { field: 'chaser_exit_time', name: 'チェイサー/退場 - 時間' },
          { field: 'chaser_exit_trigger', name: 'チェイサー/退場 - きっかけ' },
          { field: 'chaser_exit_color_type', name: 'チェイサー/退場 - 色・系統' },
          { field: 'chaser_exit_color_other', name: 'チェイサー/退場 - 色・系統その他' },
          { field: 'chaser_exit_image', name: 'チェイサー/退場 - イメージ' },
          { field: 'chaser_exit_image_path', name: 'チェイサー/退場 - イメージ画像' }
        ]

        const missingLightingFields = requiredLightingFields.filter(
          ({ field }) => !finalsInfo[field as keyof FinalsInfo]
        )

        if (missingLightingFields.length > 0) {
          const fieldNames = missingLightingFields.map(({ name }) => name).join('、')
          throw new Error(`以下の照明指示情報は必須項目です：${fieldNames}`)
        }
      }

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
            entry_id: entry.id,
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

      showToast(
        isTemporary ? '決勝情報を一時保存しました' : '決勝情報を保存しました', 
        'success'
      )
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving finals info:', error)
      
      // エラーの詳細を確認
      let errorMessage = '決勝情報の保存に失敗しました'
      
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

  const handleFileUpload = async (field: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${entry?.id}/finals/${field}_${Date.now()}.${fileExt}`
      
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

  const sections = [
    { id: 'music', label: '楽曲情報' },
    { id: 'sound', label: '音響指示情報' },
    { id: 'lighting', label: '照明指示情報' },
    { id: 'choreographer', label: '振付情報' },
    { id: 'attendance', label: '作品振付師出席情報' }
  ]

  const colorTypes = [
    '暖色系',
    '寒色系',
    'その他色指定'
  ]

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          決勝に進出された場合の詳細情報をご記入ください。
        </p>
      </div>

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
          <div className="flex items-center justify-between">
            <h4 className="font-medium">楽曲情報</h4>
            <p className="text-sm text-gray-500">
              <span className="text-red-500">*</span> は必須項目です
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              準決勝との楽曲情報の変更
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="music_change"
                  value="none"
                  checked={!finalsInfo.music_change}
                  onChange={() => handleMusicChange('none')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                準決勝と同じ楽曲を使用する
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="music_change"
                  value="preliminary"
                  checked={finalsInfo.music_change && finalsInfo.copy_preliminary_music}
                  onChange={() => handleMusicChange('fromPreliminary')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                予選と同じ楽曲を使用する
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="music_change"
                  value="new"
                  checked={finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
                  onChange={() => handleMusicChange('new')}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                予選・準決勝とは異なる楽曲を使用する
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品タイトルまたはテーマ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={finalsInfo.work_title || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, work_title: e.target.value }))}
              disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.music_change && !finalsInfo.copy_preliminary_music 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品キャラクター・ストーリー等（50字以内） <span className="text-red-500">*</span>
            </label>
            <textarea
              value={finalsInfo.work_character_story || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, work_character_story: e.target.value }))}
              disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.music_change && !finalsInfo.copy_preliminary_music 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
              rows={2}
              maxLength={50}
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
              <label className={`flex items-center ${!finalsInfo.music_change && !finalsInfo.copy_preliminary_music ? 'text-gray-500' : ''}`}>
                <input
                  type="radio"
                  name="copyright_permission"
                  value="commercial"
                  checked={finalsInfo.copyright_permission === 'commercial'}
                  onChange={() => setFinalsInfo(prev => ({ ...prev, copyright_permission: 'commercial' }))}
                  disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
                  className={`mr-2 h-4 w-4 border-gray-300 ${
                    !finalsInfo.music_change && !finalsInfo.copy_preliminary_music 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-indigo-600 focus:ring-indigo-500'
                  }`}
                />
                A.市販の楽曲を使用する
              </label>
              <label className={`flex items-center ${!finalsInfo.music_change && !finalsInfo.copy_preliminary_music ? 'text-gray-500' : ''}`}>
                <input
                  type="radio"
                  name="copyright_permission"
                  value="licensed"
                  checked={finalsInfo.copyright_permission === 'licensed'}
                  onChange={() => setFinalsInfo(prev => ({ ...prev, copyright_permission: 'licensed' }))}
                  disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
                  className={`mr-2 h-4 w-4 border-gray-300 ${
                    !finalsInfo.music_change && !finalsInfo.copy_preliminary_music 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-indigo-600 focus:ring-indigo-500'
                  }`}
                />
                B.自身で著作権に対し許諾を取った楽曲を使用する
              </label>
              <label className={`flex items-center ${!finalsInfo.music_change && !finalsInfo.copy_preliminary_music ? 'text-gray-500' : ''}`}>
                <input
                  type="radio"
                  name="copyright_permission"
                  value="original"
                  checked={finalsInfo.copyright_permission === 'original'}
                  onChange={() => setFinalsInfo(prev => ({ ...prev, copyright_permission: 'original' }))}
                  disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
                  className={`mr-2 h-4 w-4 border-gray-300 ${
                    !finalsInfo.music_change && !finalsInfo.copy_preliminary_music 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-indigo-600 focus:ring-indigo-500'
                  }`}
                />
                C.独自に製作されたオリジナル楽曲を使用する
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              使用楽曲タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={finalsInfo.music_title || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, music_title: e.target.value }))}
              disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.music_change && !finalsInfo.copy_preliminary_music 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              収録CDタイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={finalsInfo.cd_title || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, cd_title: e.target.value }))}
              disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.music_change && !finalsInfo.copy_preliminary_music 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アーティスト <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={finalsInfo.artist || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, artist: e.target.value }))}
              disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.music_change && !finalsInfo.copy_preliminary_music 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              レコード番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={finalsInfo.record_number || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, record_number: e.target.value }))}
              disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.music_change && !finalsInfo.copy_preliminary_music 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JASRAC作品コード <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={finalsInfo.jasrac_code || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, jasrac_code: e.target.value }))}
              disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.music_change && !finalsInfo.copy_preliminary_music 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              楽曲種類 <span className="text-red-500">*</span>
            </label>
            <select
              value={finalsInfo.music_type || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, music_type: e.target.value }))}
              disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.music_change && !finalsInfo.copy_preliminary_music 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            >
              <option value="">選択してください</option>
              <option value="cd">CD楽曲</option>
              <option value="download">データダウンロード楽曲</option>
              <option value="original">その他（オリジナル曲）</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${
              !finalsInfo.music_change && !finalsInfo.copy_preliminary_music ? 'text-gray-500' : 'text-gray-700'
            }`}>
              楽曲データ <span className="text-red-500">*</span>
            </label>
            <MusicFileUpload
              disabled={!finalsInfo.music_change && !finalsInfo.copy_preliminary_music}
              value={finalsInfo.music_data_path}
              onChange={(file) => handleFileUpload('music_data_path', file)}
            />
          </div>

        </div>
      )}

      {/* 音響指示情報セクション */}
      {activeSection === 'sound' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">音響指示情報</h4>
            <p className="text-sm text-gray-500">
              <span className="text-red-500">*</span> は必須項目です
            </p>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={finalsInfo.sound_change_from_semifinals || false}
                onChange={(e) => handleSoundChange(e.target.checked)}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              準決勝との音響指示の変更
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音楽スタートのタイミング（きっかけ、ポーズなど） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={finalsInfo.sound_start_timing || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, sound_start_timing: e.target.value }))}
              disabled={!finalsInfo.sound_change_from_semifinals}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.sound_change_from_semifinals 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              チェイサー（退場）曲の指定 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className={`flex items-center ${!finalsInfo.sound_change_from_semifinals ? 'text-gray-500' : ''}`}>
                <input
                  type="radio"
                  name="chaser_designation"
                  value="included"
                  checked={finalsInfo.chaser_song_designation === 'included'}
                  onChange={() => setFinalsInfo(prev => ({ ...prev, chaser_song_designation: 'included', chaser_song: '' }))}
                  disabled={!finalsInfo.sound_change_from_semifinals}
                  className={`mr-2 h-4 w-4 border-gray-300 ${
                    !finalsInfo.sound_change_from_semifinals 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-indigo-600 focus:ring-indigo-500'
                  }`}
                />
                自作曲に組み込み
              </label>
              <label className={`flex items-center ${!finalsInfo.sound_change_from_semifinals ? 'text-gray-500' : ''}`}>
                <input
                  type="radio"
                  name="chaser_designation"
                  value="required"
                  checked={finalsInfo.chaser_song_designation === 'required'}
                  onChange={() => setFinalsInfo(prev => ({ ...prev, chaser_song_designation: 'required' }))}
                  disabled={!finalsInfo.sound_change_from_semifinals}
                  className={`mr-2 h-4 w-4 border-gray-300 ${
                    !finalsInfo.sound_change_from_semifinals 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-indigo-600 focus:ring-indigo-500'
                  }`}
                />
                必要
              </label>
              <label className={`flex items-center ${!finalsInfo.sound_change_from_semifinals ? 'text-gray-500' : ''}`}>
                <input
                  type="radio"
                  name="chaser_designation"
                  value="not_required"
                  checked={finalsInfo.chaser_song_designation === 'not_required'}
                  onChange={() => setFinalsInfo(prev => ({ ...prev, chaser_song_designation: 'not_required', chaser_song: '' }))}
                  disabled={!finalsInfo.sound_change_from_semifinals}
                  className={`mr-2 h-4 w-4 border-gray-300 ${
                    !finalsInfo.sound_change_from_semifinals 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-indigo-600 focus:ring-indigo-500'
                  }`}
                />
                不要（無音）
              </label>
            </div>
          </div>

          {finalsInfo.chaser_song_designation === 'required' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                チェイサー（退場）曲音源 <span className="text-red-500">*</span>
              </label>
              <MusicFileUpload
                disabled={!finalsInfo.sound_change_from_semifinals}
                value={finalsInfo.chaser_song}
                onChange={(file) => handleFileUpload('chaser_song', file)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フェードアウト開始時間 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={finalsInfo.fade_out_start_time || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, fade_out_start_time: e.target.value }))}
              disabled={!finalsInfo.sound_change_from_semifinals}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.sound_change_from_semifinals 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
              placeholder="例：3:45"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フェードアウト完了時間 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={finalsInfo.fade_out_complete_time || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, fade_out_complete_time: e.target.value }))}
              disabled={!finalsInfo.sound_change_from_semifinals}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.sound_change_from_semifinals 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
              placeholder="例：4:00"
            />
          </div>
        </div>
      )}

      {/* 照明指示情報セクション */}
      {activeSection === 'lighting' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">照明指示情報</h4>
            <p className="text-sm text-gray-500">
              <span className="text-red-500">*</span> は必須項目です
            </p>
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={finalsInfo.lighting_change_from_semifinals || false}
                onChange={(e) => handleLightingChange(e.target.checked)}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              準決勝との照明指示の変更
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              決勝 - 踊り出しタイミング <span className="text-red-500">*</span>
            </label>
            <select
              value={finalsInfo.dance_start_timing || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, dance_start_timing: e.target.value }))}
              disabled={!finalsInfo.lighting_change_from_semifinals}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.lighting_change_from_semifinals 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            >
              <option value="">選択してください</option>
              <option value="音先">音先</option>
              <option value="板付">板付</option>
            </select>
          </div>

          {/* シーン1-5とチェイサー/退場 */}
          {[1, 2, 3, 4, 5].map((sceneNum) => (
            <div key={`scene${sceneNum}`} className="border-t pt-4">
              <h5 className="font-medium mb-3">シーン{sceneNum}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    時間 {sceneNum === 1 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!finalsInfo.lighting_change_from_semifinals}
                    value={finalsInfo[`scene${sceneNum}_time` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_time`]: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      !finalsInfo.lighting_change_from_semifinals
                        ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                        : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                    placeholder="例：0:30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    きっかけ {sceneNum === 1 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!finalsInfo.lighting_change_from_semifinals}
                    value={finalsInfo[`scene${sceneNum}_trigger` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_trigger`]: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      !finalsInfo.lighting_change_from_semifinals
                        ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                        : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    色・系統 {sceneNum === 1 && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    disabled={!finalsInfo.lighting_change_from_semifinals}
                    value={finalsInfo[`scene${sceneNum}_color_type` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_color_type`]: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      !finalsInfo.lighting_change_from_semifinals
                        ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                        : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  >
                    <option value="">選択してください</option>
                    {colorTypes.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    色・系統その他 {sceneNum === 1 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!finalsInfo.lighting_change_from_semifinals}
                    value={finalsInfo[`scene${sceneNum}_color_other` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_color_other`]: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      !finalsInfo.lighting_change_from_semifinals
                        ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                        : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    イメージ {sceneNum === 1 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    disabled={!finalsInfo.lighting_change_from_semifinals}
                    value={finalsInfo[`scene${sceneNum}_image` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_image`]: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      !finalsInfo.lighting_change_from_semifinals
                        ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                        : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    イメージ画像 {sceneNum === 1 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!finalsInfo.lighting_change_from_semifinals}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(`scene${sceneNum}_image_path`, file)
                    }}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      !finalsInfo.lighting_change_from_semifinals
                        ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                        : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    備考
                  </label>
                  <textarea
                    disabled={!finalsInfo.lighting_change_from_semifinals}
                    value={finalsInfo[`scene${sceneNum}_notes` as keyof FinalsInfo] as string || ''}
                    onChange={(e) => setFinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_notes`]: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      !finalsInfo.lighting_change_from_semifinals
                        ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                        : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
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
                  時間 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!finalsInfo.lighting_change_from_semifinals}
                  value={finalsInfo.chaser_exit_time || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_time: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                    !finalsInfo.lighting_change_from_semifinals
                      ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                      : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  きっかけ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!finalsInfo.lighting_change_from_semifinals}
                  value={finalsInfo.chaser_exit_trigger || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_trigger: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                    !finalsInfo.lighting_change_from_semifinals
                      ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                      : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  色・系統 <span className="text-red-500">*</span>
                </label>
                <select
                  disabled={!finalsInfo.lighting_change_from_semifinals}
                  value={finalsInfo.chaser_exit_color_type || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_color_type: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                    !finalsInfo.lighting_change_from_semifinals
                      ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                      : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                >
                  <option value="">選択してください</option>
                  {colorTypes.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  色・系統その他 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!finalsInfo.lighting_change_from_semifinals}
                  value={finalsInfo.chaser_exit_color_other || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_color_other: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                    !finalsInfo.lighting_change_from_semifinals
                      ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                      : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イメージ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!finalsInfo.lighting_change_from_semifinals}
                  value={finalsInfo.chaser_exit_image || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_image: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                    !finalsInfo.lighting_change_from_semifinals
                      ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                      : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イメージ画像 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={!finalsInfo.lighting_change_from_semifinals}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload('chaser_exit_image_path', file)
                  }}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                    !finalsInfo.lighting_change_from_semifinals
                      ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                      : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  disabled={!finalsInfo.lighting_change_from_semifinals}
                  value={finalsInfo.chaser_exit_notes || ''}
                  onChange={(e) => setFinalsInfo(prev => ({ ...prev, chaser_exit_notes: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                    !finalsInfo.lighting_change_from_semifinals
                      ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                      : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 振付情報セクション */}
      {activeSection === 'choreographer' && (
        <div className="space-y-4">
          <h4 className="font-medium">振付情報</h4>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={finalsInfo.choreographer_change || false}
                onChange={(e) => handleChoreographerChange(e.target.checked)}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              準決勝・予選との振付師の変更
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              決勝 - 振付師1
            </label>
            <input
              type="text"
              value={finalsInfo.choreographer_name || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer_name: e.target.value }))}
              disabled={!finalsInfo.choreographer_change}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.choreographer_change 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              決勝 - 振付師1（かな）
            </label>
            <input
              type="text"
              value={finalsInfo.choreographer_name_kana || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer_name_kana: e.target.value }))}
              disabled={!finalsInfo.choreographer_change}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.choreographer_change 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              決勝 - 振付師2
            </label>
            <input
              type="text"
              value={finalsInfo.choreographer2_name || ''}
              onChange={(e) => setFinalsInfo(prev => ({ ...prev, choreographer2_name: e.target.value }))}
              disabled={!finalsInfo.choreographer_change}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.choreographer_change 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
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
              disabled={!finalsInfo.choreographer_change}
              className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                !finalsInfo.choreographer_change 
                  ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed' 
                  : 'border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>
          
          {!finalsInfo.choreographer_change && (
            <p className="text-xs text-gray-500">
              基本情報で登録された振付師情報が使用されます。
            </p>
          )}
        </div>
      )}

      {/* 作品振付師出席情報セクション */}
      {activeSection === 'attendance' && (
        <div className="space-y-4">
          <h4 className="font-medium">作品振付師出席情報</h4>
          
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

          {finalsInfo.choreographer_photo_permission === '希望する' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作品振付師の写真
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload('choreographer_photo_path', file)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  授賞式に出席される振付師の写真をアップロードしてください
                </p>
              </div>
          )}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          ※ 決勝情報は決勝進出が決定してからでも追加・修正可能です。
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