'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { Alert, TabNavigation, SaveButton, DeadlineNoticeAsync } from '@/components/ui'
import { StartDateNotice } from '@/components/ui/StartDateNotice'
import { useFormSave } from '@/hooks'
import { updateFormStatus, checkFinalsInfoCompletion } from '@/lib/status-utils'
import { FinalsMusicSection, FinalsSoundSection, FinalsLightingSection, FinalsChoreographerSection } from '@/components/finals'
import { 
  validateFinalsSection, 
  finalsSections 
} from '@/utils/finalsValidation'
import type { Entry, FinalsInfo } from '@/lib/types'

interface FinalsInfoFormProps {
  entry: Entry
}

export default function FinalsInfoForm({ entry }: FinalsInfoFormProps) {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('music')
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [isStartDateAvailable, setIsStartDateAvailable] = useState(false)

  const handleAvailabilityChange = useCallback((isAvailable: boolean) => {
    setIsStartDateAvailable(isAvailable)
  }, [])
  
  // オプション管理のステート
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
  const [audioFiles, setAudioFiles] = useState<Record<string, { file_name: string }>>({})

  // フォーム保存フック
  const { save, saving, error, success } = useFormSave({
    tableName: 'finals_info',
    uniqueField: 'entry_id',
    redirectPath: '', // 空文字列で自動リダイレクトを無効化
    onSuccess: (message) => console.log('[FINALS SAVE SUCCESS]', message),
    onError: (message) => console.error('[FINALS SAVE ERROR]', message)
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

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase error:', error)
        throw error
      }

      if (data) {
        console.log('[FINALS DEBUG] === 決勝情報データ読み込み完了 ===')
        console.log('[FINALS DEBUG] 取得データ:', data)
        setFinalsInfo(data)
        
        // ファイル情報を読み込み
        await loadAudioFiles()
        
        // オプションの状態を復元
        if (data.music_change === false && data.music_title) {
          setMusicChangeOption('unchanged')
        } else if (data.music_change === true) {
          setMusicChangeOption('changed')
        }
        if (data.sound_change_from_semifinals === false && data.sound_start_timing) {
          setSoundChangeOption('same')
        } else if (data.sound_change_from_semifinals === true) {
          setSoundChangeOption('different')
        }
        if (data.lighting_change_from_semifinals === false && data.dance_start_timing) {
          setLightingChangeOption('same')
        } else if (data.lighting_change_from_semifinals === true) {
          setLightingChangeOption('different')
        }
        if (data.choreographer_change === false && data.choreographer_name) {
          setChoreographerChangeOption('same')
        } else if (data.choreographer_change === true) {
          setChoreographerChangeOption('different')
        }
      }
    } catch (err) {
      console.error('決勝情報の読み込みエラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAudioFiles = async () => {
    console.log('[FINALS AUDIO DEBUG] === 決勝音声ファイル読み込み開始 ===')
    try {
      const { data: filesData, error: filesError } = await supabase
        .from('entry_files')
        .select('*')
        .eq('entry_id', entry.id)
        .in('purpose', ['music_data_path', 'chaser_song'])
        .order('uploaded_at', { ascending: false })

      if (filesError) {
        console.error('[FINALS AUDIO DEBUG] ファイル取得エラー:', filesError)
        return
      }

      console.log('[FINALS AUDIO DEBUG] 取得したファイル数:', filesData?.length || 0)
      console.log('[FINALS AUDIO DEBUG] 全ファイル情報:', filesData)

      if (filesData && filesData.length > 0) {
        const filesMap: Record<string, { file_name: string }> = {}
        const urlUpdates: Record<string, string> = {}

        for (const file of filesData) {
          console.log('[FINALS AUDIO DEBUG] 処理中のファイル:', {
            id: file.id,
            file_name: file.file_name,
            file_type: file.file_type,
            purpose: file.purpose,
            file_path: file.file_path
          })

          // 音楽関連のファイルを適切なフィールドにマッピング
          const isAudioFile = (file.file_type === 'music' || file.file_type === 'audio') && 
                              !file.file_name.match(/\.(jpg|jpeg|png|gif|bmp)$/i)

          console.log('[FINALS AUDIO DEBUG] 音声ファイル判定:', isAudioFile)

          if (isAudioFile) {
            if (file.purpose === 'music_data_path' || file.purpose === 'chaser_song') {
              console.log('[FINALS AUDIO DEBUG] Purpose一致でマッピング:', file.purpose)
              filesMap[file.purpose] = { file_name: file.file_name }

              // 署名付きURLを取得
              const { data: urlData } = await supabase.storage
                .from('files')
                .createSignedUrl(file.file_path, 3600)

              if (urlData?.signedUrl) {
                urlUpdates[file.purpose] = urlData.signedUrl
              }
            }
          }
        }

        console.log('[FINALS AUDIO DEBUG] === ファイルマッピング結果 ===')
        console.log('[FINALS AUDIO DEBUG] Final audioFiles state:', filesMap)
        console.log('[FINALS AUDIO DEBUG] Final URL updates:', urlUpdates)

        setAudioFiles(filesMap)
        setFinalsInfo(prev => ({ ...prev, ...urlUpdates }))
      }
    } catch (error) {
      console.error('[FINALS AUDIO DEBUG] ファイル読み込みエラー:', error)
    }
  }

  const handleMusicChangeOption = async (option: 'changed' | 'unchanged') => {
    setMusicChangeOption(option)
    
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
            work_title_kana: semifinalsData.work_title_kana,
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
        }
      } catch (err) {
        console.error('準決勝情報の読み込みエラー:', err)
      }
    } else if (option === 'changed') {
      // 変更ありの場合はフィールドをクリア
      setFinalsInfo(prev => ({
        ...prev,
        music_change: true,
        work_title: '',
        work_title_kana: '',
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
    
    if (option === 'same') {
      // 準決勝から音響指示データをコピー
      try {
        const { data: semifinalsData } = await supabase
          .from('semifinals_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()

        if (semifinalsData) {
          console.log('[SOUND COPY] 準決勝データ:', {
            sound_start_timing: semifinalsData.sound_start_timing,
            chaser_song_designation: semifinalsData.chaser_song_designation,
            chaser_song: semifinalsData.chaser_song,
            fade_out_start_time: semifinalsData.fade_out_start_time,
            fade_out_complete_time: semifinalsData.fade_out_complete_time
          })
          
          // 準決勝の英語値を決勝の日本語値にマッピング
          const mapChaserSongDesignation = (value: string): string => {
            switch (value) {
              case 'included':
                return '自作曲に組み込み'
              case 'required':
                return '必要'
              case 'not_required':
                return '不要（無音）'
              default:
                return value // 既に日本語の場合はそのまま返す
            }
          }
          
          const mappedDesignation = mapChaserSongDesignation(semifinalsData.chaser_song_designation || '')
          console.log('[SOUND COPY] マッピング後の値:', mappedDesignation)
          
          // チェイサー曲のファイルパスがある場合は署名付きURLを生成
          let chaserSongUrl = ''
          if (semifinalsData.chaser_song && !semifinalsData.chaser_song.startsWith('http')) {
            // ファイルパスの場合、署名付きURLを生成
            const { data: urlData } = await supabase.storage
              .from('files')
              .createSignedUrl(semifinalsData.chaser_song, 3600)
            
            if (urlData?.signedUrl) {
              chaserSongUrl = urlData.signedUrl
              console.log('[SOUND COPY] チェイサー曲の署名付きURL生成:', chaserSongUrl)
            }
          } else if (semifinalsData.chaser_song) {
            // 既にURLの場合はそのまま使用
            chaserSongUrl = semifinalsData.chaser_song
          }
          
          setFinalsInfo(prev => ({
            ...prev,
            sound_change_from_semifinals: false,
            sound_start_timing: semifinalsData.sound_start_timing || '',
            chaser_song_designation: mappedDesignation,
            chaser_song: chaserSongUrl,
            fade_out_start_time: semifinalsData.fade_out_start_time || '',
            fade_out_complete_time: semifinalsData.fade_out_complete_time || ''
          }))
        }
      } catch (err) {
        console.error('準決勝情報の読み込みエラー:', err)
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

  const handleLightingChangeOption = async (option: 'same' | 'different') => {
    setLightingChangeOption(option)
    
    if (option === 'same') {
      // 準決勝から照明指示データをコピー
      try {
        const { data: semifinalsData } = await supabase
          .from('semifinals_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()

        if (semifinalsData) {
          const lightingData: Partial<FinalsInfo> = {
            lighting_change_from_semifinals: false,
            dance_start_timing: semifinalsData.dance_start_timing
          }
          
          // シーン1-5とチェイサー情報をコピー
          for (let i = 1; i <= 5; i++) {
            lightingData[`scene${i}_time` as keyof FinalsInfo] = semifinalsData[`scene${i}_time` as keyof typeof semifinalsData]
            lightingData[`scene${i}_trigger` as keyof FinalsInfo] = semifinalsData[`scene${i}_trigger` as keyof typeof semifinalsData]
            lightingData[`scene${i}_color_type` as keyof FinalsInfo] = semifinalsData[`scene${i}_color_type` as keyof typeof semifinalsData]
            lightingData[`scene${i}_color_other` as keyof FinalsInfo] = semifinalsData[`scene${i}_color_other` as keyof typeof semifinalsData]
            lightingData[`scene${i}_image` as keyof FinalsInfo] = semifinalsData[`scene${i}_image` as keyof typeof semifinalsData]
            lightingData[`scene${i}_image_path` as keyof FinalsInfo] = semifinalsData[`scene${i}_image_path` as keyof typeof semifinalsData]
            lightingData[`scene${i}_notes` as keyof FinalsInfo] = semifinalsData[`scene${i}_notes` as keyof typeof semifinalsData]
          }
          
          lightingData.chaser_exit_time = semifinalsData.chaser_exit_time
          lightingData.chaser_exit_trigger = semifinalsData.chaser_exit_trigger
          lightingData.chaser_exit_color_type = semifinalsData.chaser_exit_color_type
          lightingData.chaser_exit_color_other = semifinalsData.chaser_exit_color_other
          lightingData.chaser_exit_image = semifinalsData.chaser_exit_image
          lightingData.chaser_exit_image_path = semifinalsData.chaser_exit_image_path
          lightingData.chaser_exit_notes = semifinalsData.chaser_exit_notes
          
          setFinalsInfo(prev => ({ ...prev, ...lightingData }))
        }
      } catch (err) {
        console.error('準決勝情報の読み込みエラー:', err)
      }
    } else if (option === 'different') {
      // 異なる照明指示の場合はフィールドをクリア
      const clearedData: Partial<FinalsInfo> = {
        lighting_change_from_semifinals: true,
        dance_start_timing: ''
      }
      
      // シーン1-5とチェイサー情報をクリア
      for (let i = 1; i <= 5; i++) {
        clearedData[`scene${i}_time` as keyof FinalsInfo] = undefined
        clearedData[`scene${i}_trigger` as keyof FinalsInfo] = undefined
        clearedData[`scene${i}_color_type` as keyof FinalsInfo] = undefined
        clearedData[`scene${i}_color_other` as keyof FinalsInfo] = undefined
        clearedData[`scene${i}_image` as keyof FinalsInfo] = undefined
        clearedData[`scene${i}_image_path` as keyof FinalsInfo] = undefined
        clearedData[`scene${i}_notes` as keyof FinalsInfo] = undefined
      }
      
      clearedData.chaser_exit_time = undefined
      clearedData.chaser_exit_trigger = undefined
      clearedData.chaser_exit_color_type = ''
      clearedData.chaser_exit_color_other = ''
      clearedData.chaser_exit_image = ''
      clearedData.chaser_exit_image_path = ''
      clearedData.chaser_exit_notes = ''
      
      setFinalsInfo(prev => ({ ...prev, ...clearedData }))
    }
  }

  const handleChoreographerChangeOption = async (option: 'same' | 'different') => {
    setChoreographerChangeOption(option)
    
    if (option === 'same') {
      // 準決勝から振付師データをコピー
      try {
        const { data: semifinalsData } = await supabase
          .from('semifinals_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()

        if (semifinalsData) {
          console.log('[FINALS DEBUG] 準決勝データ:', semifinalsData)
          setFinalsInfo(prev => ({
            ...prev,
            choreographer_change: false,
            choreographer_name: semifinalsData.choreographer_name,
            choreographer_furigana: semifinalsData.choreographer_furigana,
            choreographer2_name: semifinalsData.choreographer2_name,
            choreographer2_furigana: semifinalsData.choreographer2_furigana
          }))
          console.log('[FINALS DEBUG] 振付師情報をコピーしました')
        }
      } catch (err) {
        console.error('準決勝情報の読み込みエラー:', err)
      }
    } else if (option === 'different') {
      // 異なる振付師の場合はフィールドをクリア
      setFinalsInfo(prev => ({
        ...prev,
        choreographer_change: true,
        choreographer_name: '',
        choreographer_furigana: '',
        choreographer2_name: '',
        choreographer2_furigana: ''
      }))
    }
  }

  const handleFileUpload = async (field: string, file: File) => {
    try {
      console.log('[UPLOAD] Starting upload for field:', field)
      
      // ファイルアップロード前に現在の入力データを一時保存
      try {
        const tempSaveData = { ...finalsInfo, entry_id: entry.id }
        await save(tempSaveData)
        console.log('[FINALS UPLOAD] 一時保存完了')
      } catch (tempSaveError) {
        console.log('[FINALS UPLOAD] 一時保存に失敗（続行）:', tempSaveError)
      }
      
      // 既存のファイルがある場合は先に削除
      if (finalsInfo[field as keyof FinalsInfo]) {
        await handleFileDelete(field)
      }
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${entry.id}/finals/${field}_${Date.now()}.${fileExt}`
      
      console.log('[UPLOAD] Uploading to:', fileName)
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) {
        console.error('[UPLOAD] Storage upload error:', uploadError)
        throw uploadError
      }

      // ファイル情報をデータベースに保存
      const fileType = field === 'choreographer_photo_path' ? 'photo' : 
                      field.includes('image') ? 'photo' : 'audio'
      
      const insertData = {
        entry_id: entry.id,
        file_type: fileType,
        file_name: file.name,
        file_path: fileName,
        purpose: field,
        uploaded_at: new Date().toISOString()
      }
      
      console.log('[UPLOAD] Saving to database:', insertData)
      
      const { error: dbError } = await supabase
        .from('entry_files')
        .insert(insertData)
      
      if (dbError) {
        console.log('[UPLOAD] Database insert error (may already exist):', dbError)
      }

      // URLを取得
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      // finals_infoテーブルも更新
      const { error: updateError } = await supabase
        .from('finals_info')
        .update({
          [field]: fileName
        })
        .eq('entry_id', entry.id)
      
      if (updateError) {
        console.log('[UPLOAD] Error updating finals_info:', updateError)
      }

      setFinalsInfo(prev => ({
        ...prev,
        [field]: publicUrl
      }))
      
      // audioFiles状態も更新（音声ファイルの場合）
      if (fileType === 'audio') {
        console.log('[UPLOAD] Updating audioFiles state for field:', field)
        setAudioFiles(prev => ({
          ...prev,
          [field]: { file_name: file.name }
        }))
      }
      
      console.log('[UPLOAD] File uploaded successfully')
    } catch (err) {
      console.error('[UPLOAD] File upload error:', err)
    }
  }

  const handleFileDelete = async (field: string) => {
    try {
      console.log('[DELETE] Starting delete for field:', field)
      
      // URLからファイルパスを抽出する関数（セキュリティチェック付き）
      const extractFilePathFromUrl = (urlOrPath: string): string | null => {
        if (!urlOrPath) return null
        
        // 既にファイルパスの場合（URLではない）
        if (!urlOrPath.startsWith('http') && !urlOrPath.includes('://')) {
          console.log('[DELETE] Direct file path detected:', urlOrPath)
          return urlOrPath
        }
        
        // URLの場合はパスを抽出
        if (!urlOrPath.includes('ckffwsmgtivqjqkhppkj.supabase.co')) {
          console.error('[SECURITY] Invalid URL domain', urlOrPath)
          return null
        }
        
        // Supabase URLからファイルパスを抽出
        const match = urlOrPath.match(/files\/(.*?)(\?|$)/)
        if (match && match[1]) {
          const filePath = decodeURIComponent(match[1])
          
          // パス走査攻撃を防ぐ
          if (filePath.includes('../') || filePath.includes('..\\')) {
            console.error('[SECURITY] Path traversal detected')
            return null
          }
          
          // ファイルパスの形式を確認
          // パスは「entryId/finals/」または「userId/entryId/semifinals/」の形式（準決勝からコピーされた場合）
          if (entry.id) {
            const finalsPattern = `${entry.id}/finals/`
            const semifinalsPattern = `/semifinals/` // 準決勝からのファイル
            
            const isValidPath = filePath.startsWith(finalsPattern) || 
                               (filePath.includes(entry.id) && filePath.includes(semifinalsPattern))
            
            console.log('[DELETE] パス検証:', {
              filePath,
              finalsPattern,
              semifinalsPattern,
              isValidPath
            })
            
            if (!isValidPath) {
              console.error('[SECURITY] File path does not match expected pattern')
              console.log('[DELETE] Expected patterns:', { finalsPattern, semifinalsPattern })
              console.log('[DELETE] Actual path:', filePath)
              return null
            }
          }
          
          return filePath
        }
        return null
      }
      
      // ファイルパスを取得
      const fileUrl = finalsInfo[field as keyof FinalsInfo] as string
      if (!fileUrl) {
        console.log('[DELETE] No file to delete')
        return
      }

      const storagePath = extractFilePathFromUrl(fileUrl)
      if (!storagePath) {
        console.error('[DELETE] Could not extract valid file path from URL')
        return
      }

      console.log('[DELETE] Deleting file:', storagePath)

      // ストレージからファイルを削除
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([storagePath])

      if (storageError) {
        console.error('[DELETE] Storage delete error:', storageError)
        // ストレージエラーがあってもUIは更新する
      }

      // entry_filesテーブルからも削除を試みる
      const { error: dbError } = await supabase
        .from('entry_files')
        .delete()
        .eq('entry_id', entry.id)
        .eq('file_path', storagePath)

      if (dbError) {
        console.log('[DELETE] Database delete error (may not exist):', dbError)
      }

      // finals_infoテーブルのフィールドもクリア
      const { error: updateError } = await supabase
        .from('finals_info')
        .update({
          [field]: null
        })
        .eq('entry_id', entry.id)
      
      if (updateError) {
        console.error('[DELETE] Error updating finals_info:', updateError)
      }

      // UIの状態を更新
      setFinalsInfo(prev => ({
        ...prev,
        [field]: ''
      }))
      
      // audioFiles状態も更新（音声ファイルの場合）
      if (field === 'music_data_path' || field === 'chaser_song') {
        console.log('[DELETE] Updating audioFiles state for field:', field)
        setAudioFiles(prev => {
          const newState = { ...prev }
          delete newState[field]
          return newState
        })
      }

      console.log('[DELETE] File deleted successfully')
    } catch (err) {
      console.error('[DELETE] File deletion error:', err)
    }
  }

  const handleFieldChange = (updates: Partial<FinalsInfo>) => {
    setFinalsInfo(prev => ({ ...prev, ...updates }))
  }

  const handleSectionChange = (sectionId: string) => {
    // 現在のセクションの検証
    const currentErrors = validateFinalsSection(activeSection, finalsInfo)
    setValidationErrors(prev => ({
      ...prev,
      [activeSection]: currentErrors
    }))
    
    setActiveSection(sectionId)
  }

  const handleSave = async () => {
    // 50文字制限のチェック
    if (finalsInfo.work_character_story && finalsInfo.work_character_story.length > 50) {
      return
    }

    // バリデーションはステータスチェック用のみ（保存は常に可能）

    const dataToSave = {
      ...finalsInfo,
      entry_id: entry.id
    }

    await save(dataToSave)
    
    // 必須項目が完了している場合はステータスを「登録済み」に更新
    const isComplete = checkFinalsInfoCompletion(finalsInfo)
    await updateFormStatus('finals_info', entry.id, isComplete)
    
    // 保存成功後にダッシュボードにリダイレクト
    setValidationErrors({})
    showToast('決勝情報を保存しました', 'success')
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  // タブ用のデータを準備
  const tabs = finalsSections.map(section => ({
    ...section,
    hasErrors: validationErrors[section.id]?.length > 0,
    isComplete: validateFinalsSection(section.id, finalsInfo).length === 0
  }))

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">決勝情報</h3>

      <StartDateNotice 
        section="finals"
        onAvailabilityChange={handleAvailabilityChange}
      />

      {/* 入力開始日後のみフォーム表示 */}
      {isStartDateAvailable && (
        <>
          <DeadlineNoticeAsync deadlineKey="finals_deadline" />

          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          {/* セクションタブ */}
          <TabNavigation
            tabs={tabs}
            activeTab={activeSection}
            onTabChange={handleSectionChange}
          />

          {/* 各セクションのコンテンツ */}
      {activeSection === 'music' && (
        <FinalsMusicSection
          finalsInfo={finalsInfo}
          musicChangeOption={musicChangeOption}
          validationErrors={validationErrors.music || []}
          onChange={handleFieldChange}
          onMusicChangeOption={handleMusicChangeOption}
          onFileUpload={handleFileUpload}
          onFileDelete={handleFileDelete}
          audioFiles={audioFiles}
        />
      )}

      {activeSection === 'sound' && (
        <FinalsSoundSection
          finalsInfo={finalsInfo}
          soundChangeOption={soundChangeOption}
          validationErrors={validationErrors.sound || []}
          onChange={handleFieldChange}
          onSoundChangeOption={handleSoundChangeOption}
          onFileUpload={handleFileUpload}
          onFileDelete={handleFileDelete}
          audioFiles={audioFiles}
        />
      )}

      {activeSection === 'lighting' && (
        <FinalsLightingSection
          finalsInfo={finalsInfo}
          lightingChangeOption={lightingChangeOption}
          validationErrors={validationErrors.lighting || []}
          onChange={handleFieldChange}
          onLightingChangeOption={handleLightingChangeOption}
          onFileUpload={handleFileUpload}
        />
      )}

      {activeSection === 'choreographer' && (
        <FinalsChoreographerSection
          finalsInfo={finalsInfo}
          choreographerChangeOption={choreographerChangeOption}
          validationErrors={validationErrors.choreographer || []}
          onChange={handleFieldChange}
          onChoreographerChangeOption={handleChoreographerChangeOption}
          onFileUpload={handleFileUpload}
        />
      )}

          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              ダッシュボードに戻る
            </button>
            <SaveButton
              onClick={handleSave}
              disabled={saving}
              loading={saving}
            />
          </div>
        </>
      )}

      {/* 入力開始日前は戻るボタンのみ表示 */}
      {!isStartDateAvailable && (
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            ダッシュボードに戻る
          </button>
        </div>
      )}
    </div>
  )
}