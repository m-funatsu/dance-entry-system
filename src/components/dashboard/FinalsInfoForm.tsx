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
import type { Entry, FinalsInfo, SemifinalsInfo } from '@/lib/types'

interface FinalsInfoFormProps {
  entry: Entry
  isEditable?: boolean
}

export default function FinalsInfoForm({ entry, isEditable = true }: FinalsInfoFormProps) {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  
  console.log('FinalsInfoForm isEditable:', isEditable)
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
  const [isInitializing, setIsInitializing] = useState(true)

  // フォーム保存フック
  const { save, saving, error, success } = useFormSave({
    tableName: 'finals_info',
    uniqueField: 'entry_id',
    redirectPath: '', // 空文字列で自動リダイレクトを無効化
    onSuccess: (message) => console.log('[FINALS SAVE SUCCESS]', message),
    onError: (message) => console.error('[FINALS SAVE ERROR]', message)
  })

  useEffect(() => {
    const initializeForm = async () => {
      // 1. 決勝情報を読み込んでオプション状態を復元
      await loadFinalsInfo()
      
      // 2. 準決勝情報を読み込み（同期は実行しない）
      await loadSemifinalsInfo()
      
      console.log('[FINALS INIT] 初期化完了')
      setIsInitializing(false)
    }
    
    initializeForm()
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
        console.log('[OPTION RESTORE] === オプション状態復元 ===')
        console.log('[OPTION RESTORE] sound_change_from_semifinals:', data.sound_change_from_semifinals)
        if (data.sound_change_from_semifinals === false) {
          setSoundChangeOption('same')
          console.log('[OPTION RESTORE] 音響指示: same')
        } else if (data.sound_change_from_semifinals === true) {
          setSoundChangeOption('different')
          console.log('[OPTION RESTORE] 音響指示: different')
        }
        
        console.log('[OPTION RESTORE] lighting_change_from_semifinals:', data.lighting_change_from_semifinals)
        if (data.lighting_change_from_semifinals === false) {
          setLightingChangeOption('same')
          console.log('[OPTION RESTORE] 照明指示: same')
        } else if (data.lighting_change_from_semifinals === true) {
          setLightingChangeOption('different')
          console.log('[OPTION RESTORE] 照明指示: different')
        }
        
        console.log('[OPTION RESTORE] choreographer_change:', data.choreographer_change)
        if (data.choreographer_change === false) {
          setChoreographerChangeOption('same')
          console.log('[OPTION RESTORE] 振付師情報: same')
        } else if (data.choreographer_change === true) {
          setChoreographerChangeOption('different')
          console.log('[OPTION RESTORE] 振付師情報: different')
        }
      }
    } catch (err) {
      console.error('決勝情報の読み込みエラー:', err)
    } finally {
      setLoading(false)
    }
  }

  // 準決勝情報を読み込む関数
  const loadSemifinalsInfo = async (): Promise<Partial<SemifinalsInfo> | null> => {
    try {
      console.log('[SYNC] 準決勝情報を読み込み中...')
      const { data: semifinalsData, error } = await supabase
        .from('semifinals_info')
        .select('*')
        .eq('entry_id', entry.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('[SYNC] 準決勝情報読み込みエラー:', error)
        return null
      }

      if (semifinalsData) {
        console.log('[SYNC] 準決勝情報読み込み完了:', {
          updated_at: semifinalsData.updated_at,
          music_title: semifinalsData.music_title,
          choreographer_name: semifinalsData.choreographer_name
        })
        return semifinalsData
      }
      
      return null
    } catch (err) {
      console.error('[SYNC] 準決勝情報読み込みエラー:', err)
      return null
    }
  }


  // 手動オプション変更時の即座同期用関数（UI用）
  const syncMusicData = async (semifinalsData: Partial<SemifinalsInfo>) => {
    // 手動同期時に既存の音楽データファイルを削除
    if (finalsInfo.music_data_path) {
      try {
        console.log('[MUSIC SYNC] 既存のmusic_data_pathファイルを削除中')
        await handleFileDelete('music_data_path')
      } catch (error) {
        console.error('[MUSIC SYNC] music_data_path削除エラー:', error)
        // 削除エラーがあっても同期処理は続行
      }
    }
    
    setFinalsInfo(prev => ({
      ...prev,
      work_title: semifinalsData.work_title || '',
      work_title_kana: semifinalsData.work_title_kana || '',
      work_character_story: semifinalsData.work_character_story || '',
      copyright_permission: semifinalsData.copyright_permission || '',
      music_title: semifinalsData.music_title || '',
      artist: semifinalsData.artist || '',
      cd_title: semifinalsData.cd_title || '',
      record_number: semifinalsData.record_number || '',
      jasrac_code: semifinalsData.jasrac_code || '',
      music_type: semifinalsData.music_type || '',
      music_data_path: semifinalsData.music_data_path || ''
    }))
  }

  const syncSoundData = async (semifinalsData: Partial<SemifinalsInfo>) => {
    // 手動同期時に既存の音楽ファイルを削除
    if (finalsInfo.chaser_song) {
      try {
        console.log('[SOUND SYNC] 既存のchaser_songファイルを削除中')
        await handleFileDelete('chaser_song')
      } catch (error) {
        console.error('[SOUND SYNC] chaser_song削除エラー:', error)
        // 削除エラーがあっても同期処理は続行
      }
    }
    
    const mapChaserSongDesignation = (value: string): string => {
      switch (value) {
        case 'included': return '自作曲に組み込み'
        case 'required': return '必要'
        case 'not_required': return '不要（無音）'
        default: return value
      }
    }
    
    setFinalsInfo(prev => ({
      ...prev,
      sound_start_timing: semifinalsData.sound_start_timing || '',
      chaser_song_designation: mapChaserSongDesignation(semifinalsData.chaser_song_designation || ''),
      chaser_song: semifinalsData.chaser_song || '',
      fade_out_start_time: semifinalsData.fade_out_start_time || '',
      fade_out_complete_time: semifinalsData.fade_out_complete_time || ''
    }))
  }

  const syncLightingData = async (semifinalsData: Partial<SemifinalsInfo>) => {
    // 手動同期時に既存の画像ファイルを削除
    const imageFields = ['scene1_image', 'scene1_image_path', 'chaser_exit_image', 'chaser_exit_image_path']
    
    for (const field of imageFields) {
      if (finalsInfo[field as keyof FinalsInfo]) {
        try {
          console.log(`[LIGHTING SYNC] 既存の${field}ファイルを削除中`)
          await handleFileDelete(field)
        } catch (error) {
          console.error(`[LIGHTING SYNC] ${field}削除エラー:`, error)
          // 削除エラーがあっても同期処理は続行
        }
      }
    }
    
    setFinalsInfo(prev => ({
      ...prev,
      dance_start_timing: semifinalsData.dance_start_timing || '',
      scene1_time: semifinalsData.scene1_time || '',
      scene1_trigger: semifinalsData.scene1_trigger || '',
      scene1_color_type: semifinalsData.scene1_color_type || '',
      scene1_color_other: semifinalsData.scene1_color_other || '',
      scene1_image: semifinalsData.scene1_image || '',
      scene1_image_path: semifinalsData.scene1_image_path || '',
      scene1_notes: semifinalsData.scene1_notes || '',
      chaser_exit_time: semifinalsData.chaser_exit_time || '',
      chaser_exit_trigger: semifinalsData.chaser_exit_trigger || '',
      chaser_exit_color_type: semifinalsData.chaser_exit_color_type || '',
      chaser_exit_color_other: semifinalsData.chaser_exit_color_other || '',
      chaser_exit_image: semifinalsData.chaser_exit_image || '',
      chaser_exit_image_path: semifinalsData.chaser_exit_image_path || '',
      chaser_exit_notes: semifinalsData.chaser_exit_notes || ''
    }))
  }

  const syncChoreographerData = async (semifinalsData: Partial<SemifinalsInfo>) => {
    setFinalsInfo(prev => ({
      ...prev,
      choreographer_name: semifinalsData.choreographer_name || '',
      choreographer_furigana: semifinalsData.choreographer_name_kana || '',
      choreographer2_name: semifinalsData.choreographer2_name || '',
      choreographer2_furigana: semifinalsData.choreographer2_furigana || ''
    }))
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
                .createSignedUrl(file.file_path, 86400)

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
    console.log('[MUSIC OPTION] === 楽曲情報オプション変更開始 ===')
    console.log('[MUSIC OPTION] 選択されたオプション:', option)
    console.log('[MUSIC OPTION] 初期化中:', isInitializing)
    
    setMusicChangeOption(option)
    
    // 初期化中は同期処理をスキップ
    if (isInitializing) {
      console.log('[MUSIC OPTION] 初期化中のため同期をスキップ')
      return
    }
    
    if (option === 'unchanged') {
      // 準決勝から最新データを取得してコピー
      const semifinalsData = await loadSemifinalsInfo()
      if (semifinalsData) {
        console.log('[MUSIC OPTION] 準決勝情報を楽曲情報にコピー')
        await syncMusicData(semifinalsData)
        setFinalsInfo(prev => ({ ...prev, music_change: false }))
        showToast('楽曲情報を準決勝からコピーしました', 'success')
      } else {
        showToast('準決勝情報が見つかりません', 'error')
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
    console.log('[SOUND OPTION] === 音響指示オプション変更開始 ===')
    console.log('[SOUND OPTION] 選択されたオプション:', option)
    console.log('[SOUND OPTION] 初期化中:', isInitializing)
    
    setSoundChangeOption(option)
    
    // 初期化中は同期処理をスキップ
    if (isInitializing) {
      console.log('[SOUND OPTION] 初期化中のため同期をスキップ')
      return
    }
    
    if (option === 'same') {
      // 準決勝から最新データを取得してコピー
      const semifinalsData = await loadSemifinalsInfo()
      if (semifinalsData) {
        console.log('[SOUND OPTION] 準決勝情報を音響指示にコピー')
        await syncSoundData(semifinalsData)
        setFinalsInfo(prev => ({ ...prev, sound_change_from_semifinals: false }))
        showToast('音響指示を準決勝からコピーしました', 'success')
      } else {
        showToast('準決勝情報が見つかりません', 'error')
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
    console.log('[LIGHTING OPTION] === 照明指示オプション変更開始 ===')
    console.log('[LIGHTING OPTION] 選択されたオプション:', option)
    console.log('[LIGHTING OPTION] 現在のlightingChangeOption:', lightingChangeOption)
    console.log('[LIGHTING OPTION] 初期化中:', isInitializing)
    
    setLightingChangeOption(option)
    
    // 初期化中は同期処理をスキップ
    if (isInitializing) {
      console.log('[LIGHTING OPTION] 初期化中のため同期をスキップ')
      return
    }
    
    if (option === 'same') {
      // 準決勝から最新データを取得してコピー
      const semifinalsData = await loadSemifinalsInfo()
      if (semifinalsData) {
        console.log('[LIGHTING OPTION] 準決勝情報を照明指示にコピー')
        await syncLightingData(semifinalsData)
        setFinalsInfo(prev => ({ ...prev, lighting_change_from_semifinals: false }))
        showToast('照明指示を準決勝からコピーしました', 'success')
      } else {
        showToast('準決勝情報が見つかりません', 'error')
      }
    } else if (option === 'different') {
      console.log('[LIGHTING OPTION] 異なる照明指示選択 - フィールドをクリア開始')
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
      console.log('[LIGHTING OPTION] 照明指示データクリア完了 - lighting_change_from_semifinals:', true)
    }
    console.log('[LIGHTING OPTION] === 照明指示オプション変更完了 ===')
  }

  const handleChoreographerChangeOption = async (option: 'same' | 'different') => {
    console.log('[CHOREOGRAPHER OPTION] === 振付師情報オプション変更開始 ===')
    console.log('[CHOREOGRAPHER OPTION] 選択されたオプション:', option)
    console.log('[CHOREOGRAPHER OPTION] 初期化中:', isInitializing)
    
    setChoreographerChangeOption(option)
    
    // 初期化中は同期処理をスキップ
    if (isInitializing) {
      console.log('[CHOREOGRAPHER OPTION] 初期化中のため同期をスキップ')
      return
    }
    
    if (option === 'same') {
      // 準決勝から最新データを取得してコピー
      const semifinalsData = await loadSemifinalsInfo()
      if (semifinalsData) {
        console.log('[CHOREOGRAPHER OPTION] 準決勝情報を振付師情報にコピー')
        await syncChoreographerData(semifinalsData)
        setFinalsInfo(prev => ({ ...prev, choreographer_change: false }))
        showToast('振付師情報を準決勝からコピーしました', 'success')
      } else {
        showToast('準決勝情報が見つかりません', 'error')
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

      // 署名付きURLを取得（24時間有効）
      const { data: urlData, error: urlError } = await supabase.storage
        .from('files')
        .createSignedUrl(fileName, 86400)
        
      if (urlError) {
        console.error('[FINALS UPLOAD] URL生成エラー:', urlError)
        throw urlError
      }

      // finals_infoテーブルも更新
      const { error: updateError } = await supabase
        .from('finals_info')
        .update({
          [field]: urlData?.signedUrl || fileName
        })
        .eq('entry_id', entry.id)
      
      if (updateError) {
        console.log('[UPLOAD] Error updating finals_info:', updateError)
      }

      setFinalsInfo(prev => ({
        ...prev,
        [field]: urlData?.signedUrl || fileName
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
      console.log('[DELETE] === 削除処理開始 ===')
      console.log('[DELETE] 削除対象フィールド:', field)
      console.log('[DELETE] 現在のfinalsInfo:', finalsInfo)
      console.log('[DELETE] フィールドの現在値:', finalsInfo[field as keyof typeof finalsInfo])
      
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
    console.log('[FINALS SAVE] === 決勝情報保存開始 ===')
    console.log('[FINALS SAVE] 保存データ:', finalsInfo)
    console.log('[FINALS SAVE] lighting_change_from_semifinals:', finalsInfo.lighting_change_from_semifinals)
    console.log('[FINALS SAVE] 現在のlightingChangeOption:', lightingChangeOption)
    
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
    console.log('[FINALS SAVE] データベース保存完了')
    
    // 必須項目が完了している場合はステータスを「登録済み」に更新
    const isComplete = checkFinalsInfoCompletion(finalsInfo)
    await updateFormStatus('finals_info', entry.id, isComplete)
    
    // 保存成功後にデータを再読み込み（リロードの代わり）
    setValidationErrors({})
    showToast('決勝情報を保存しました', 'success')
    
    // データを再読み込み（同期を実行しないため）
    await loadFinalsInfo()
    await loadAudioFiles()
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
      <h3 className="text-lg font-semibold text-gray-900">決勝情報</h3>

      <StartDateNotice 
        section="finals"
        onAvailabilityChange={handleAvailabilityChange}
      />

      {/* 入力開始日後のみフォーム表示 */}
      {isStartDateAvailable && (
        <>
          {isEditable && <DeadlineNoticeAsync deadlineKey="finals_deadline" />}

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
          isEditable={isEditable}
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
          isEditable={isEditable}
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
          isEditable={isEditable}
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
          onFileDelete={handleFileDelete}
          isEditable={isEditable}
        />
      )}

          <div className="flex justify-end pt-6">
            <SaveButton
              onClick={handleSave}
              disabled={saving || !isEditable}
              loading={saving}
            />
          </div>
        </>
      )}

    </div>
  )
}