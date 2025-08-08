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
          
          // すべてのファイル情報を取得
          const { data: filesData } = await supabase
            .from('entry_files')
            .select('*')
            .eq('entry_id', entry.id)
          
          console.log('[DEBUG] All files from database:', filesData)
          
          // チェイサー曲の検索デバッグ
          if (filesData) {
            const chaserFiles = filesData.filter(f => 
              f.purpose === 'chaser_song' || 
              f.file_path?.includes('chaser_song')
            )
            console.log('[DEBUG] Chaser song files found:', chaserFiles)
          }
          
          if (filesData && filesData.length > 0) {
            const filesMap: Record<string, EntryFile> = {}
            const urlUpdates: Record<string, string> = {}
            
            for (const file of filesData) {
              // 音楽関連のファイルを適切なフィールドにマッピング
              // ファイル拡張子でもチェックして、誤ったfile_typeを除外
              const isAudioFile = (file.file_type === 'music' || file.file_type === 'audio') && 
                                  !file.file_name.match(/\.(jpg|jpeg|png|gif|bmp)$/i)
              
              if (isAudioFile) {
                // purposeが設定されている場合はそれを使用
                if (file.purpose === 'music_data_path' || file.purpose === 'chaser_song') {
                  filesMap[file.purpose] = file
                  
                  // 署名付きURLを取得
                  const { data: urlData } = await supabase.storage
                    .from('files')
                    .createSignedUrl(file.file_path, 3600)
                  
                  if (urlData?.signedUrl) {
                    urlUpdates[file.purpose] = urlData.signedUrl
                  }
                }
                // purposeがnullまたは空の場合、ファイル名から推測
                else if (!file.purpose || file.purpose === null) {
                  // ファイルパスから目的を推測
                  if (file.file_path.includes('chaser_song')) {
                    filesMap['chaser_song'] = file
                    
                    // 署名付きURLを取得
                    const { data: urlData } = await supabase.storage
                      .from('files')
                      .createSignedUrl(file.file_path, 3600)
                    
                    if (urlData?.signedUrl) {
                      urlUpdates['chaser_song'] = urlData.signedUrl
                    }
                  } else if (file.file_path.includes('music_data_path')) {
                    filesMap['music_data_path'] = file
                    
                    // 署名付きURLを取得
                    const { data: urlData } = await supabase.storage
                      .from('files')
                      .createSignedUrl(file.file_path, 3600)
                    
                    if (urlData?.signedUrl) {
                      urlUpdates['music_data_path'] = urlData.signedUrl
                    }
                  }
                }
              }
            }
            
            console.log('[DEBUG] Final audioFiles state:', filesMap)
            console.log('[DEBUG] Final URL updates:', urlUpdates)
            
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
      console.log(`[UPLOAD DEBUG] Starting upload for field: ${field}`)
      console.log('[UPLOAD DEBUG] File:', file.name, file.type, file.size)
      
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

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw uploadError
      }

      // ファイル情報をデータベースに保存（purposeフィールドを確実に設定）
      // チェイサー曲とmusic_data_pathは音声ファイルとして保存
      const insertData = {
        entry_id: entry.id,
        file_type: 'audio',  // 音声ファイルは'audio'タイプ
        file_name: file.name,
        file_path: fileName,
        purpose: field  // purposeフィールドを確実に設定
      }
      
      console.log('[UPLOAD DEBUG] Inserting to database:', insertData)
      
      const { data: fileData, error: dbError } = await supabase
        .from('entry_files')
        .insert(insertData)
        .select()
        .single()

      if (dbError) {
        console.error('[UPLOAD DEBUG] Database insert error:', dbError)
        throw dbError
      }
      
      console.log('[UPLOAD DEBUG] File saved to database:', fileData)
      
      // 署名付きURLを取得
      const { data: urlData } = await supabase.storage
        .from('files')
        .createSignedUrl(fileName, 3600)

      // UIの状態を更新
      setSemifinalsInfo(prev => ({
        ...prev,
        [field]: urlData?.signedUrl || ''
      }))

      setAudioFiles(prev => ({
        ...prev,
        [field]: fileData
      }))
      
      // semifinals_infoテーブルの音楽関連フィールドも更新
      if ((field === 'music_data_path' || field === 'chaser_song') && entry.id) {
        // まず既存のレコードがあるか確認
        const { data: existingData } = await supabase
          .from('semifinals_info')
          .select('id')
          .eq('entry_id', entry.id)
          .maybeSingle()
        
        if (existingData) {
          // 既存レコードがある場合は更新
          const { error: updateError } = await supabase
            .from('semifinals_info')
            .update({
              [field]: fileName
            })
            .eq('entry_id', entry.id)
          
          if (updateError) {
            console.error('Error updating semifinals_info:', updateError)
          }
        } else {
          // 既存レコードがない場合は作成
          const { error: insertError } = await supabase
            .from('semifinals_info')
            .insert({
              entry_id: entry.id,
              [field]: fileName
            })
          
          if (insertError) {
            console.error('Error inserting semifinals_info:', insertError)
          }
        }
      }

      showToast('ファイルをアップロードしました', 'success')
    } catch (err) {
      console.error('ファイルアップロードエラー:', err)
      showToast('ファイルのアップロードに失敗しました', 'error')
    }
  }

  const handleFileDelete = async (field: string) => {
    try {
      console.log(`[DELETE DEBUG] Starting delete for field: ${field}`)
      console.log('[DELETE DEBUG] Current audioFiles state:', audioFiles)
      console.log('[DELETE DEBUG] Current semifinalsInfo:', semifinalsInfo)
      
      // ファイル情報を取得（audioFilesまたはデータベースから）
      let fileToDelete = audioFiles[field]
      console.log('[DELETE DEBUG] File from audioFiles:', fileToDelete)
      
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
          
          // ユーザーIDとエントリーIDが含まれているか確認
          if (userId && entry?.id) {
            const expectedPathPrefix = `${userId}/${entry.id}/`
            if (!filePath.startsWith(expectedPathPrefix)) {
              console.error('[SECURITY] File path does not match user/entry')
              return null
            }
          }
          
          return filePath
        }
        return null
      }
      
      // audioFilesにない場合は、データベースから取得
      if (!fileToDelete && entry?.id) {
        console.log('[DELETE DEBUG] File not in audioFiles, searching database...')
        
        // まずpurposeフィールドで検索
        const { data: filesData, error: searchError } = await supabase
          .from('entry_files')
          .select('*')
          .eq('entry_id', entry.id)
          .eq('purpose', field)
          .maybeSingle()
        
        console.log('[DELETE DEBUG] Search by purpose result:', filesData)
        console.log('[DELETE DEBUG] Search by purpose error:', searchError)
        
        // purposeで見つからない場合、ファイルパスで検索
        let fileToDeleteFromDb = filesData
        if (!fileToDeleteFromDb) {
          console.log('[DELETE DEBUG] Not found by purpose, searching all audio files...')
          
          const { data: allFiles, error: allFilesError } = await supabase
            .from('entry_files')
            .select('*')
            .eq('entry_id', entry.id)
            .in('file_type', ['music', 'audio'])
          
          console.log('[DELETE DEBUG] All audio files:', allFiles)
          console.log('[DELETE DEBUG] All files error:', allFilesError)
          
          if (allFiles) {
            // ファイルパスにフィールド名が含まれているものを探す
            fileToDeleteFromDb = allFiles.find(f => f.file_path?.includes(field))
            console.log('[DELETE DEBUG] Found by path search:', fileToDeleteFromDb)
          }
        }
        
        if (fileToDeleteFromDb) {
          fileToDelete = fileToDeleteFromDb
        }
      }
      
      // それでも見つからない場合、URLから直接ファイルパスを取得
      let filePathToDelete: string | null = null
      if (!fileToDelete && semifinalsInfo[field as keyof SemifinalsInfo]) {
        const fieldValue = semifinalsInfo[field as keyof SemifinalsInfo]
        if (typeof fieldValue === 'string' && fieldValue.includes('supabase.co')) {
          filePathToDelete = extractFilePathFromUrl(fieldValue)
          console.log('[DELETE DEBUG] Extracted file path from URL:', filePathToDelete)
          
          if (filePathToDelete) {
            // 仮のファイル情報を作成（ストレージから削除するため）
            fileToDelete = {
              id: '',  // 空文字列を使用（nullは型エラーになるため）
              file_path: filePathToDelete,
              file_name: filePathToDelete.split('/').pop() || '',
              entry_id: entry?.id || '',
              file_type: 'audio',
              purpose: field,
              uploaded_at: new Date().toISOString()  // 現在時刻を設定
            } as EntryFile
            console.log('[DELETE DEBUG] Created pseudo file object from URL')
          }
        }
      }
      
      if (!fileToDelete) {
        console.log('[DELETE DEBUG] No file to delete - this might be normal if no file exists')
        // ファイルがない場合は正常終了
        return
      }
      
      console.log('[DELETE DEBUG] File to delete:', fileToDelete)

      // ストレージからファイルを削除（追加の安全性チェック）
      if (fileToDelete.file_path) {
        // 削除前の最終確認：パスが正しいユーザー/エントリーのものか
        const pathToDelete = fileToDelete.file_path
        const isValidPath = userId && entry?.id && 
                           pathToDelete.startsWith(`${userId}/${entry.id}/`)
        
        if (!isValidPath) {
          console.error('[SECURITY] Attempted to delete file outside user scope')
          showToast('ファイルの削除に失敗しました（権限エラー）', 'error')
          return
        }
        
        const { error: storageError } = await supabase.storage
          .from('files')
          .remove([pathToDelete])

        if (storageError) {
          console.error('Storage delete error:', storageError)
          // ストレージエラーがあってもデータベースからは削除を試みる
        }
      }

      // データベースからレコードを削除
      if (fileToDelete.id) {
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
      
      // semifinals_infoテーブルのmusic_data_pathまたはchaser_songもクリア
      if ((field === 'music_data_path' || field === 'chaser_song') && entry?.id) {
        const { error: updateError } = await supabase
          .from('semifinals_info')
          .update({
            [field]: null
          })
          .eq('entry_id', entry.id)
        
        if (updateError) {
          console.error('Error updating semifinals_info:', updateError)
        }
      }

      showToast('ファイルを削除しました', 'success')
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
          onFileDelete={handleFileDelete}
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