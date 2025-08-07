'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { Alert, TabNavigation, TemporarySaveButton, SaveButton, CancelButton } from '@/components/ui'
import { useFormSave } from '@/hooks'
import { MusicSection, SoundSection, LightingSection, ChoreographerSection, BankSection } from '@/components/semifinals'
import { 
  validateSemifinalsSection, 
  validateAllSemifinalsSection, 
  isSemifinalsAllRequiredFieldsValid,
  semifinalsSections 
} from '@/utils/semifinalsValidation'
import type { Entry, SemifinalsInfo, BasicInfo, PreliminaryInfo, EntryFile } from '@/lib/types'

interface SemifinalsFormProps {
  userId: string
  entry: Entry | null
}

export default function SemifinalsForm({ entry, userId }: SemifinalsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [basicInfo, setBasicInfo] = useState<BasicInfo | null>(null)
  const [preliminaryInfo, setPreliminaryInfo] = useState<PreliminaryInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('music')
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [audioFiles, setAudioFiles] = useState<Record<string, EntryFile>>({})
  
  const [semifinalsInfo, setSemifinalsInfo] = useState<Partial<SemifinalsInfo>>({
    entry_id: entry?.id || '',
    music_change_from_preliminary: false,
    copyright_permission: '',
    choreographer_change_from_preliminary: false
  })

  // フォーム保存フック
  const { save, saving, error, success } = useFormSave({
    tableName: 'semifinals_info',
    uniqueField: 'entry_id',
    redirectPath: '/dashboard',
    onSuccess: (message) => showToast(message, 'success'),
    onError: (message) => showToast(message, 'error')
  })

  // データを読み込む
  useEffect(() => {
    if (!entry?.id) {
      setLoading(false)
      return
    }
    
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
          
          // 楽曲ファイル情報を取得
          const { data: filesData } = await supabase
            .from('entry_files')
            .select('*')
            .eq('entry_id', entry.id)
            .eq('file_type', 'music')
          
          console.log('Loading music files:', filesData)
          
          if (filesData && filesData.length > 0) {
            const filesMap: Record<string, EntryFile> = {}
            const urlUpdates: Record<string, string> = {}
            
            for (const file of filesData) {
              // purposeが'music_data_path'または他の音楽関連フィールドの場合
              if (file.purpose && file.purpose.includes('music')) {
                filesMap[file.purpose] = file
                
                // 署名付きURLを取得
                const { data: urlData } = await supabase.storage
                  .from('files')
                  .createSignedUrl(file.file_path, 3600)
                
                if (urlData?.signedUrl) {
                  urlUpdates[file.purpose] = urlData.signedUrl
                }
              }
            }
            
            console.log('Files map:', filesMap)
            console.log('URL updates:', urlUpdates)
            
            setAudioFiles(filesMap)
            setSemifinalsInfo(prev => ({ ...prev, ...urlUpdates }))
          }
        } else {
          // 新規作成時の初期設定
          const initialData: Partial<SemifinalsInfo> = {
            entry_id: entry.id,
            music_change_from_preliminary: false,
            copyright_permission: '',
            choreographer_change_from_preliminary: false
          }
          
          if (basicData) {
            // 基本情報から振付師情報をデフォルト設定
            initialData.choreographer_name = basicData.choreographer || ''
            initialData.choreographer_name_kana = basicData.choreographer_furigana || ''
          }
          
          if (prelimData) {
            // 予選情報から楽曲情報をデフォルト設定
            initialData.work_title = prelimData.work_title || ''
            initialData.work_character_story = prelimData.work_story || ''
            initialData.music_title = prelimData.music_title || ''
            initialData.cd_title = prelimData.cd_title || ''
            initialData.artist = prelimData.artist || ''
            initialData.record_number = prelimData.record_number || ''
            initialData.jasrac_code = prelimData.jasrac_code || ''
            initialData.music_type = prelimData.music_type || ''
          }
          
          setSemifinalsInfo(initialData)
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

  // タブ切り替え時の検証
  const handleSectionChange = (sectionId: string) => {
    // 現在のセクションの検証
    const currentErrors = validateSemifinalsSection(activeSection, semifinalsInfo)
    setValidationErrors(prev => ({
      ...prev,
      [activeSection]: currentErrors
    }))
    
    setActiveSection(sectionId)
  }

  const handleFieldChange = (updates: Partial<SemifinalsInfo>) => {
    setSemifinalsInfo(prev => ({ ...prev, ...updates }))
  }

  const handleFileUpload = async (field: string, file: File) => {
    try {
      if (!entry?.id) {
        showToast('基本情報を先に保存してください', 'error')
        return
      }

      // 既存のファイルがある場合は削除
      if (audioFiles[field]) {
        await handleFileDelete(field)
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${entry.id}/semifinals/${field}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // ファイル情報をデータベースに保存
      const { data: fileData, error: dbError } = await supabase
        .from('entry_files')
        .insert({
          entry_id: entry.id,
          file_type: 'music',
          file_name: file.name,
          file_path: fileName,
          purpose: field
        })
        .select()
        .single()

      if (dbError) throw dbError

      // 署名付きURLを取得
      const { data: urlData } = await supabase.storage
        .from('files')
        .createSignedUrl(fileName, 3600)

      setSemifinalsInfo(prev => ({
        ...prev,
        [field]: urlData?.signedUrl || ''
      }))

      setAudioFiles(prev => ({
        ...prev,
        [field]: fileData
      }))

      showToast('ファイルをアップロードしました', 'success')
    } catch (err) {
      console.error('ファイルアップロードエラー:', err)
      showToast('ファイルのアップロードに失敗しました', 'error')
    }
  }

  const handleFileDelete = async (field: string) => {
    try {
      console.log('Deleting file for field:', field)
      console.log('Current audioFiles:', audioFiles)
      
      // ファイル情報を取得（audioFilesまたはデータベースから）
      let fileToDelete = audioFiles[field]
      
      // audioFilesにない場合は、データベースから取得
      if (!fileToDelete && entry?.id) {
        console.log('File not in audioFiles, fetching from database...')
        const { data: filesData } = await supabase
          .from('entry_files')
          .select('*')
          .eq('entry_id', entry.id)
          .eq('purpose', field)
          .single()
        
        if (filesData) {
          fileToDelete = filesData
          console.log('Found file in database:', fileToDelete)
        }
      }
      
      if (!fileToDelete) {
        console.log('No file to delete')
        showToast('削除するファイルが見つかりません', 'error')
        return
      }

      // ストレージからファイルを削除
      if (fileToDelete.file_path) {
        console.log('Deleting from storage:', fileToDelete.file_path)
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([fileToDelete.file_path])

        if (storageError) {
          console.error('Storage delete error:', storageError)
          // ストレージエラーがあってもデータベースからは削除を試みる
        }
      }

      // データベースからレコードを削除
      if (fileToDelete.id) {
        console.log('Deleting from database, id:', fileToDelete.id)
        const { error: dbError } = await supabase
          .from('entry_files')
          .delete()
          .eq('id', fileToDelete.id)

        if (dbError) {
          console.error('Database delete error:', dbError)
          throw dbError
        }
      }

      // UIの状態を更新
      setSemifinalsInfo(prev => ({
        ...prev,
        [field]: ''
      }))

      setAudioFiles(prev => {
        const newFiles = { ...prev }
        delete newFiles[field]
        return newFiles
      })

      showToast('ファイルを削除しました', 'success')
      console.log('File deleted successfully')
    } catch (err) {
      console.error('ファイル削除エラー:', err)
      showToast('ファイルの削除に失敗しました', 'error')
    }
  }

  const handleSave = async (isTemporary = false) => {
    if (!entry?.id) {
      showToast('基本情報を先に保存してください', 'error')
      router.push('/dashboard/basic-info')
      return
    }

    // 必須項目チェック（一時保存時はスキップ）
    if (!isTemporary) {
      const allErrors = validateAllSemifinalsSection(semifinalsInfo)
      if (Object.keys(allErrors).length > 0) {
        setValidationErrors(allErrors)
        const firstErrorSection = Object.keys(allErrors)[0]
        setActiveSection(firstErrorSection)
        showToast('必須項目を入力してください', 'error')
        return
      }
    }

    // 50文字制限のチェック
    if (semifinalsInfo.work_character_story && semifinalsInfo.work_character_story.length > 50) {
      showToast('作品キャラクター・ストーリー等は50文字以内で入力してください', 'error')
      return
    }

    const dataToSave = {
      ...semifinalsInfo,
      entry_id: entry.id
    }

    await save(dataToSave, isTemporary)
    // save関数が例外をスローしなければ成功とみなす
    // 保存成功時はエラーをクリア
    setValidationErrors({})
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  // タブ用のデータを準備
  const tabs = semifinalsSections.map(section => ({
    ...section,
    hasErrors: validationErrors[section.id]?.length > 0,
    isComplete: validateSemifinalsSection(section.id, semifinalsInfo).length === 0
  }))

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          準決勝に進出された場合の詳細情報をご記入ください。
        </p>
      </div>

      {/* セクションタブ */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeSection}
        onTabChange={handleSectionChange}
      />

      {/* 各セクションのコンテンツ */}
      {activeSection === 'music' && (
        <MusicSection
          semifinalsInfo={semifinalsInfo}
          preliminaryInfo={preliminaryInfo}
          validationErrors={validationErrors.music || []}
          onChange={handleFieldChange}
          onFileUpload={handleFileUpload}
          onFileDelete={handleFileDelete}
        />
      )}

      {activeSection === 'sound' && (
        <SoundSection
          semifinalsInfo={semifinalsInfo}
          validationErrors={validationErrors.sound || []}
          onChange={handleFieldChange}
          onFileUpload={handleFileUpload}
        />
      )}

      {activeSection === 'lighting' && (
        <LightingSection
          semifinalsInfo={semifinalsInfo}
          validationErrors={validationErrors.lighting || []}
          onChange={handleFieldChange}
          onFileUpload={handleFileUpload}
        />
      )}

      {activeSection === 'choreographer' && (
        <ChoreographerSection
          semifinalsInfo={semifinalsInfo}
          basicInfo={basicInfo}
          onChange={handleFieldChange}
        />
      )}

      {activeSection === 'bank' && (
        <BankSection
          semifinalsInfo={semifinalsInfo}
          validationErrors={validationErrors.bank || []}
          onChange={handleFieldChange}
        />
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          ※ 準決勝情報は準決勝進出が決定してからでも追加・修正可能です。
        </p>
      </div>

      <div className="flex justify-between pt-6">
        <CancelButton onClick={() => router.push('/dashboard')} />
        <div className="space-x-4">
          <TemporarySaveButton
            onClick={() => handleSave(true)}
            disabled={saving || !entry}
            loading={saving}
          />
          <SaveButton
            onClick={() => handleSave(false)}
            disabled={saving || !entry || !isSemifinalsAllRequiredFieldsValid(semifinalsInfo)}
            loading={saving}
          />
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