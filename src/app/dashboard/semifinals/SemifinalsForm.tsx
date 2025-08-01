'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry, SemifinalsInfo, BasicInfo, PreliminaryInfo } from '@/lib/types'

interface SemifinalsFormProps {
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

export default function SemifinalsForm({ entry }: SemifinalsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null)
  const [preliminaryInfo, setPreliminaryInfo] = useState<PreliminaryInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('music')
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  
  const [semifinalsInfo, setSemifinalsInfo] = useState<Partial<SemifinalsInfo>>({
    entry_id: entry?.id || '',
    music_change_from_preliminary: false,
    copyright_permission: '',
    choreographer_change_from_preliminary: false
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
        } else {
          // 新規作成時の初期設定
          if (basicData) {
            // 基本情報から振付師情報をデフォルト設定
            setSemifinalsInfo(prev => ({
              ...prev,
              choreographer_name: basicData.choreographer || '',
              choreographer_name_kana: basicData.choreographer_furigana || ''
            }))
          }
          
          if (prelimData) {
            // 予選情報から楽曲情報をデフォルト設定（予選と同じ楽曲を選択状態）
            setSemifinalsInfo(prev => ({
              ...prev,
              music_change_from_preliminary: false,
              work_title: prelimData.work_title || '',
              work_character_story: prelimData.work_story || '',
              music_title: prelimData.music_title || '',
              cd_title: prelimData.cd_title || '',
              artist: prelimData.artist || '',
              record_number: prelimData.record_number || '',
              jasrac_code: prelimData.jasrac_code || '',
              music_type: prelimData.music_type || ''
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
  const handleMusicChange = (useSameMusic: boolean) => {
    if (useSameMusic) {
      // 予選と同じ楽曲を使用する場合：予選情報からコピー
      setSemifinalsInfo(prev => ({
        ...prev,
        music_change_from_preliminary: false,
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
      // 予選とは異なる楽曲を使用する場合：クリア
      setSemifinalsInfo(prev => ({
        ...prev,
        music_change_from_preliminary: true,
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

  // 振付師変更チェックボックスの処理
  const handleChoreographerChange = (checked: boolean) => {
    if (checked) {
      // チェックが入った場合：クリア
      setSemifinalsInfo(prev => ({
        ...prev,
        choreographer_change_from_preliminary: true,
        choreographer_name: '',
        choreographer_name_kana: ''
      }))
    } else {
      // チェックが外れた場合：基本情報から復元
      setSemifinalsInfo(prev => ({
        ...prev,
        choreographer_change_from_preliminary: false,
        choreographer_name: basicInfo?.choreographer || '',
        choreographer_name_kana: basicInfo?.choreographer_furigana || ''
      }))
    }
  }

  // 各タブの必須項目チェック
  const validateSection = (sectionId: string): string[] => {
    const errors: string[] = []

    switch (sectionId) {
      case 'music':
        if (semifinalsInfo.music_change_from_preliminary === undefined) {
          errors.push('「予選との楽曲情報の変更」を選択してください')
        }
        if (!semifinalsInfo.work_title) errors.push('作品タイトルまたはテーマ')
        if (!semifinalsInfo.work_character_story) errors.push('作品キャラクター・ストーリー等')
        if (!semifinalsInfo.copyright_permission) errors.push('楽曲著作権許諾')
        if (!semifinalsInfo.music_title) errors.push('使用楽曲タイトル')
        if (!semifinalsInfo.cd_title) errors.push('収録CDタイトル')
        if (!semifinalsInfo.artist) errors.push('アーティスト')
        if (!semifinalsInfo.record_number) errors.push('レコード番号')
        if (!semifinalsInfo.jasrac_code) errors.push('JASRAC作品コード')
        if (!semifinalsInfo.music_type) errors.push('楽曲種類')
        if (!semifinalsInfo.music_data_path) errors.push('楽曲データ')
        break

      case 'sound':
        if (!semifinalsInfo.sound_start_timing) errors.push('音楽スタートのタイミング')
        if (!semifinalsInfo.chaser_song_designation) errors.push('チェイサー（退場）曲の指定')
        if (semifinalsInfo.chaser_song_designation === 'required' && !semifinalsInfo.chaser_song) {
          errors.push('チェイサー（退場）曲音源')
        }
        if (!semifinalsInfo.fade_out_start_time) errors.push('フェードアウト開始時間')
        if (!semifinalsInfo.fade_out_complete_time) errors.push('フェードアウト完了時間')
        break

      case 'lighting':
        if (!semifinalsInfo.dance_start_timing) errors.push('準決勝 - 踊り出しタイミング')
        if (!semifinalsInfo.scene1_time) errors.push('シーン1 - 時間')
        if (!semifinalsInfo.scene1_trigger) errors.push('シーン1 - きっかけ')
        if (!semifinalsInfo.scene1_color_type) errors.push('シーン1 - 色・系統')
        if (!semifinalsInfo.scene1_color_other) errors.push('シーン1 - 色・系統その他')
        if (!semifinalsInfo.scene1_image) errors.push('シーン1 - イメージ')
        if (!semifinalsInfo.scene1_image_path) errors.push('シーン1 - イメージ画像')
        if (!semifinalsInfo.chaser_exit_time) errors.push('チェイサー/退場 - 時間')
        if (!semifinalsInfo.chaser_exit_trigger) errors.push('チェイサー/退場 - きっかけ')
        if (!semifinalsInfo.chaser_exit_color_type) errors.push('チェイサー/退場 - 色・系統')
        if (!semifinalsInfo.chaser_exit_color_other) errors.push('チェイサー/退場 - 色・系統その他')
        if (!semifinalsInfo.chaser_exit_image) errors.push('チェイサー/退場 - イメージ')
        if (!semifinalsInfo.chaser_exit_image_path) errors.push('チェイサー/退場 - イメージ画像')
        break

      case 'choreographer':
        // 振付情報は必須項目なし
        break

      case 'bank':
        // 賞金振込先情報の必須項目
        if (!semifinalsInfo.bank_name) errors.push('銀行名')
        if (!semifinalsInfo.branch_name) errors.push('支店名')
        if (!semifinalsInfo.account_type) errors.push('口座種類')
        if (!semifinalsInfo.account_number) errors.push('口座番号')
        if (!semifinalsInfo.account_holder) errors.push('口座名義')
        break
    }

    return errors
  }

  // 全セクションの検証
  const validateAllSections = () => {
    const allErrors: Record<string, string[]> = {}
    const sectionIds = ['music', 'sound', 'lighting', 'choreographer', 'bank']
    
    sectionIds.forEach(sectionId => {
      const errors = validateSection(sectionId)
      if (errors.length > 0) {
        allErrors[sectionId] = errors
      }
    })
    
    return allErrors
  }

  // 全ての必須項目が入力されているかチェック
  const isAllRequiredFieldsValid = () => {
    const allErrors = validateAllSections()
    return Object.keys(allErrors).length === 0
  }

  // タブ切り替え時の検証
  const handleSectionChange = (sectionId: string) => {
    // 現在のセクションの検証
    const currentErrors = validateSection(activeSection)
    setValidationErrors(prev => ({
      ...prev,
      [activeSection]: currentErrors
    }))
    
    setActiveSection(sectionId)
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
        const allErrors = validateAllSections()
        const errorSections = Object.entries(allErrors)
          .filter(([, errors]) => errors.length > 0)
          .map(([section, errors]) => {
            const sectionName = sections.find(s => s.id === section)?.label || section
            return `${sectionName}: ${errors.join('、')}`
          })

        if (errorSections.length > 0) {
          setValidationErrors(allErrors)
          showToast('必須項目を入力してください', 'error')
          // 最初のエラーがあるセクションに移動
          const firstErrorSection = Object.keys(allErrors)[0]
          setActiveSection(firstErrorSection)
          return
        }
      }

      // 50文字制限のチェック
      if (semifinalsInfo.work_character_story && semifinalsInfo.work_character_story.length > 50) {
        throw new Error('作品キャラクター・ストーリー等は50文字以内で入力してください')
      }

      const { data: existingData } = await supabase
        .from('semifinals_info')
        .select('id')
        .eq('entry_id', entry.id)
        .maybeSingle()

      if (existingData) {
        // 更新
        const { error } = await supabase
          .from('semifinals_info')
          .update({
            ...semifinalsInfo,
            entry_id: entry.id,
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

      // 保存成功時はエラーをクリア
      setValidationErrors({})
      
      showToast(
        isTemporary ? '準決勝情報を一時保存しました' : '準決勝情報を保存しました', 
        'success'
      )
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving semifinals info:', error)
      
      // エラーの詳細を確認
      let errorMessage = '準決勝情報の保存に失敗しました'
      
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
      // エラーが発生してもデータは保持される（setStateで管理されているため）
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (field: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${entry?.id}/semifinals/${field}_${Date.now()}.${fileExt}`
      
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
    { id: 'bank', label: '賞金振込先情報' }
  ]

  // セクションが完了しているかチェック
  const isSectionComplete = (sectionId: string) => {
    const errors = validateSection(sectionId)
    return errors.length === 0
  }

  const colorTypes = [
    '暖色系',
    '寒色系',
    'その他色指定'
  ]

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          準決勝に進出された場合の詳細情報をご記入ください。
        </p>
      </div>

      {/* セクションタブ */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionChange(section.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center">
                {section.label}
                {validationErrors[section.id]?.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    !
                  </span>
                )}
                {isSectionComplete(section.id) && !validationErrors[section.id] && (
                  <svg className="ml-2 w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
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
          
          {validationErrors.music && validationErrors.music.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800 font-medium">以下の項目を入力してください：</p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-2">
                {validationErrors.music.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予選との楽曲情報の変更 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="music_change"
                  value="same"
                  checked={!semifinalsInfo.music_change_from_preliminary}
                  onChange={() => handleMusicChange(true)}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  required
                />
                予選と同じ楽曲を使用する
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="music_change"
                  value="different"
                  checked={semifinalsInfo.music_change_from_preliminary || false}
                  onChange={() => handleMusicChange(false)}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  required
                />
                予選とは異なる楽曲を使用する
              </label>
            </div>
            
            {!semifinalsInfo.music_change_from_preliminary && (
              <p className="text-xs text-gray-500 mt-2">
                予選で登録された楽曲情報が使用されます。
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品タイトルまたはテーマ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.work_title || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, work_title: e.target.value }))}
              disabled={!semifinalsInfo.music_change_from_preliminary}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !semifinalsInfo.music_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              作品キャラクター・ストーリー等（50字以内） <span className="text-red-500">*</span>
            </label>
            <textarea
              value={semifinalsInfo.work_character_story || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, work_character_story: e.target.value }))}
              disabled={!semifinalsInfo.music_change_from_preliminary}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !semifinalsInfo.music_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
              rows={2}
              maxLength={50}
            />
            <div className="text-sm text-gray-500 mt-1">
              {semifinalsInfo.work_character_story?.length || 0}/50文字
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              楽曲著作権許諾 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="copyright_permission"
                  value="commercial"
                  checked={semifinalsInfo.copyright_permission === 'commercial'}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, copyright_permission: 'commercial' }))}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
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
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
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
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
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
              value={semifinalsInfo.music_title || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, music_title: e.target.value }))}
              disabled={!semifinalsInfo.music_change_from_preliminary}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !semifinalsInfo.music_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              収録CDタイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.cd_title || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, cd_title: e.target.value }))}
              disabled={!semifinalsInfo.music_change_from_preliminary}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !semifinalsInfo.music_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アーティスト <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.artist || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, artist: e.target.value }))}
              disabled={!semifinalsInfo.music_change_from_preliminary}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !semifinalsInfo.music_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              レコード番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.record_number || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, record_number: e.target.value }))}
              disabled={!semifinalsInfo.music_change_from_preliminary}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !semifinalsInfo.music_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              JASRAC作品コード <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.jasrac_code || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, jasrac_code: e.target.value }))}
              disabled={!semifinalsInfo.music_change_from_preliminary}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !semifinalsInfo.music_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              楽曲種類 <span className="text-red-500">*</span>
            </label>
            <select
              value={semifinalsInfo.music_type || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, music_type: e.target.value }))}
              disabled={!semifinalsInfo.music_change_from_preliminary}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !semifinalsInfo.music_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
            >
              <option value="">選択してください</option>
              <option value="cd">CD楽曲</option>
              <option value="download">データダウンロード楽曲</option>
              <option value="original">その他（オリジナル曲）</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              楽曲データ <span className="text-red-500">*</span>
            </label>
            <MusicFileUpload
              disabled={false}
              value={semifinalsInfo.music_data_path}
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
          
          {validationErrors.sound && validationErrors.sound.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800 font-medium">以下の項目を入力してください：</p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-2">
                {validationErrors.sound.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              音楽スタートのタイミング（きっかけ、ポーズなど） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.sound_start_timing || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, sound_start_timing: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              チェイサー（退場）曲の指定 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="chaser_designation"
                  value="included"
                  checked={semifinalsInfo.chaser_song_designation === 'included'}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, chaser_song_designation: 'included', chaser_song: '' }))}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                自作曲に組み込み
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="chaser_designation"
                  value="required"
                  checked={semifinalsInfo.chaser_song_designation === 'required'}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, chaser_song_designation: 'required' }))}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                必要
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="chaser_designation"
                  value="not_required"
                  checked={semifinalsInfo.chaser_song_designation === 'not_required'}
                  onChange={() => setSemifinalsInfo(prev => ({ ...prev, chaser_song_designation: 'not_required', chaser_song: '' }))}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                不要（無音）
              </label>
            </div>
          </div>

          {semifinalsInfo.chaser_song_designation === 'required' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                チェイサー（退場）曲音源 <span className="text-red-500">*</span>
              </label>
              <MusicFileUpload
                disabled={false}
                value={semifinalsInfo.chaser_song}
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
              value={semifinalsInfo.fade_out_start_time || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, fade_out_start_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例：3:45"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フェードアウト完了時間 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.fade_out_complete_time || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, fade_out_complete_time: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
          
          {validationErrors.lighting && validationErrors.lighting.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800 font-medium">以下の項目を入力してください：</p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-2">
                {validationErrors.lighting.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              準決勝 - 踊り出しタイミング <span className="text-red-500">*</span>
            </label>
            <select
              value={semifinalsInfo.dance_start_timing || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, dance_start_timing: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    value={semifinalsInfo[`scene${sceneNum}_time` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_time`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="例：0:30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    きっかけ {sceneNum === 1 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={semifinalsInfo[`scene${sceneNum}_trigger` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_trigger`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    色・系統 {sceneNum === 1 && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={semifinalsInfo[`scene${sceneNum}_color_type` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_color_type`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                    value={semifinalsInfo[`scene${sceneNum}_color_other` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_color_other`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    イメージ {sceneNum === 1 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={semifinalsInfo[`scene${sceneNum}_image` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_image`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    イメージ画像 {sceneNum === 1 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(`scene${sceneNum}_image_path`, file)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    備考
                  </label>
                  <textarea
                    value={semifinalsInfo[`scene${sceneNum}_notes` as keyof SemifinalsInfo] as string || ''}
                    onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, [`scene${sceneNum}_notes`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                  value={semifinalsInfo.chaser_exit_time || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  きっかけ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={semifinalsInfo.chaser_exit_trigger || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_trigger: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  色・系統 <span className="text-red-500">*</span>
                </label>
                <select
                  value={semifinalsInfo.chaser_exit_color_type || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_color_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                  value={semifinalsInfo.chaser_exit_color_other || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_color_other: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イメージ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={semifinalsInfo.chaser_exit_image || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_image: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  イメージ画像 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload('chaser_exit_image_path', file)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備考
                </label>
                <textarea
                  value={semifinalsInfo.chaser_exit_notes || ''}
                  onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, chaser_exit_notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                checked={semifinalsInfo.choreographer_change_from_preliminary || false}
                onChange={(e) => handleChoreographerChange(e.target.checked)}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
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
              disabled={!semifinalsInfo.choreographer_change_from_preliminary}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !semifinalsInfo.choreographer_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
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
              disabled={!semifinalsInfo.choreographer_change_from_preliminary}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                !semifinalsInfo.choreographer_change_from_preliminary ? 'bg-gray-100 text-gray-500' : ''
              }`}
            />
          </div>
          
          {!semifinalsInfo.choreographer_change_from_preliminary && (
            <p className="text-xs text-gray-500">
              基本情報で登録された振付師情報が使用されます。
            </p>
          )}
        </div>
      )}

      {/* 賞金振込先情報セクション */}
      {activeSection === 'bank' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">賞金振込先情報</h4>
            <p className="text-sm text-gray-500">
              <span className="text-red-500">*</span> は必須項目です
            </p>
          </div>
          
          {validationErrors.bank && validationErrors.bank.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800 font-medium">以下の項目を入力してください：</p>
              <ul className="list-disc list-inside text-sm text-red-700 mt-2">
                {validationErrors.bank.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              銀行名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.bank_name || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, bank_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支店名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.branch_name || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, branch_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              口座種類 <span className="text-red-500">*</span>
            </label>
            <select
              value={semifinalsInfo.account_type || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, account_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">選択してください</option>
              <option value="普通">普通</option>
              <option value="当座">当座</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              口座番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.account_number || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, account_number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              口座名義 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={semifinalsInfo.account_holder || ''}
              onChange={(e) => setSemifinalsInfo(prev => ({ ...prev, account_holder: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="カタカナで入力してください"
            />
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          ※ 準決勝情報は準決勝進出が決定してからでも追加・修正可能です。
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
            disabled={saving || !entry || !isAllRequiredFieldsValid()}
            className={`px-6 py-2 rounded-md text-sm font-medium text-white ${
              saving || !entry || !isAllRequiredFieldsValid()
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