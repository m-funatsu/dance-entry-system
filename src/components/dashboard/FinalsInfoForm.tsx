'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Alert, TabNavigation, TemporarySaveButton, SaveButton, DeadlineNoticeAsync } from '@/components/ui'
import { useFormSave } from '@/hooks'
import { FinalsMusicSection, FinalsSoundSection, FinalsLightingSection, FinalsChoreographerSection } from '@/components/finals'
import { 
  validateFinalsSection, 
  validateAllFinalsSection, 
  isFinalsAllRequiredFieldsValid,
  finalsSections 
} from '@/utils/finalsValidation'
import type { Entry, FinalsInfo } from '@/lib/types'

interface FinalsInfoFormProps {
  entry: Entry
}

export default function FinalsInfoForm({ entry }: FinalsInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('music')
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  
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

  // フォーム保存フック
  const { save, saving, error, success } = useFormSave({
    tableName: 'finals_info',
    uniqueField: 'entry_id',
    redirectPath: '/dashboard',
    onSuccess: () => router.refresh(),
    onError: (message) => console.error(message)
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
        setFinalsInfo(data)
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
          
          setFinalsInfo(prev => ({
            ...prev,
            sound_change_from_semifinals: false,
            sound_start_timing: semifinalsData.sound_start_timing || '',
            chaser_song_designation: semifinalsData.chaser_song_designation || '',
            chaser_song: semifinalsData.chaser_song || '',
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
          setFinalsInfo(prev => ({
            ...prev,
            choreographer_change: false,
            choreographer_name: semifinalsData.choreographer_name,
            choreographer_name_kana: semifinalsData.choreographer_name_kana
          }))
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
        choreographer_name_kana: ''
      }))
    }
  }

  const handleFileUpload = async (field: string, file: File) => {
    try {
      console.log('[UPLOAD] Starting upload for field:', field)
      
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
      
      console.log('[UPLOAD] File uploaded successfully')
    } catch (err) {
      console.error('[UPLOAD] File upload error:', err)
    }
  }

  const handleFileDelete = async (field: string) => {
    try {
      console.log('[DELETE] Starting delete for field:', field)
      
      // URLからファイルパスを抽出する関数（セキュリティチェック付き）
      const extractFilePathFromUrl = (url: string): string | null => {
        if (!url) return null
        
        // URLが自分のSupabaseプロジェクトのものか確認
        if (!url.includes('ckffwsmgtivqjqkhppkj.supabase.co')) {
          console.error('[SECURITY] Invalid URL domain')
          return null
        }
        
        // Supabase URLからファイルパスを抽出
        const match = url.match(/files\/(.*?)(\?|$)/)
        if (match && match[1]) {
          const filePath = decodeURIComponent(match[1])
          
          // パス走査攻撃を防ぐ
          if (filePath.includes('../') || filePath.includes('..\\')) {
            console.error('[SECURITY] Path traversal detected')
            return null
          }
          
          // ファイルパスの形式を確認
          // パスは「entryId/finals/」の形式
          if (entry.id) {
            const validPattern = `${entry.id}/finals/`
            
            if (!filePath.startsWith(validPattern)) {
              console.error('[SECURITY] File path does not match expected pattern')
              console.log('[DELETE] Expected pattern:', validPattern)
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

  const handleSave = async (isTemporary = false) => {
    // 50文字制限のチェック
    if (finalsInfo.work_character_story && finalsInfo.work_character_story.length > 50) {
      return
    }

    // 必須項目チェック（一時保存時はスキップ）
    if (!isTemporary) {
      const allErrors = validateAllFinalsSection(finalsInfo)
      if (Object.keys(allErrors).length > 0) {
        setValidationErrors(allErrors)
        const firstErrorSection = Object.keys(allErrors)[0]
        setActiveSection(firstErrorSection)
        return
      }
    }

    const dataToSave = {
      ...finalsInfo,
      entry_id: entry.id
    }

    await save(dataToSave, isTemporary)
    // save関数が例外をスローしなければ成功とみなす
    // 保存成功時はエラーをクリア
    setValidationErrors({})
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

      <div className="flex justify-end pt-6 space-x-4">
        <TemporarySaveButton
          onClick={() => handleSave(true)}
          disabled={saving}
          loading={saving}
        />
        <SaveButton
          onClick={() => handleSave(false)}
          disabled={saving || !isFinalsAllRequiredFieldsValid(finalsInfo)}
          loading={saving}
        />
      </div>
    </div>
  )
}