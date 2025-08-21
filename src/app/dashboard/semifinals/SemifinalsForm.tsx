'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { updateFormStatus, checkSemifinalsInfoCompletion } from '@/lib/status-utils'
import { Alert, TabNavigation, SaveButton, CancelButton } from '@/components/ui'
import { useFormSave } from '@/hooks'
import { DebugLogger } from '@/lib/debug-logger'
import { MusicSection, SoundSection, LightingSection, ChoreographerSection, BankSection } from '@/components/semifinals'
import { 
  validateSemifinalsSection, 
  semifinalsSections 
} from '@/utils/semifinalsValidation'
import type { Entry, SemifinalsInfo, PreliminaryInfo, EntryFile } from '@/lib/types'

interface SemifinalsFormProps {
  userId: string
  entry: Entry | null
}

export default function SemifinalsForm({ entry, userId }: SemifinalsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const debugLogger = DebugLogger.getInstance()
  
  // クライアントサイドでのデバッグロガー初期化を確認
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as unknown as Record<string, unknown>).debugLogger = debugLogger
      debugLogger.log('SEMIFINALS INIT', 'コンポーネント初期化完了', { 
        hasEntry: !!entry,
        entryId: entry?.id 
      })
    }
  }, [debugLogger, entry])
  
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
    redirectPath: '', // リダイレクトを無効化
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
        debugLogger.log('SEMIFINALS INIT', 'データ読み込み開始', { entry_id: entry.id })
        
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
          debugLogger.log('SEMIFINALS LOAD', '準決勝情報読み込み完了', {
            id: semiData.id,
            work_title: semiData.work_title,
            work_title_kana: semiData.work_title_kana,
            music_change_from_preliminary: semiData.music_change_from_preliminary
          })
          setSemifinalsInfo(semiData)
          
          // すべてのファイル情報を取得
          console.log('[MUSIC DEBUG] === ファイル取得クエリ開始 ===')
          console.log('[MUSIC DEBUG] entry.id:', entry.id)
          
          const { data: filesData, error: filesError } = await supabase
            .from('entry_files')
            .select('*')
            .eq('entry_id', entry.id)
          
          if (filesError) {
            console.error('[MUSIC DEBUG] ファイル取得エラー:', filesError)
            return
          }
          
          console.log('[MUSIC DEBUG] ファイル取得成功')
          console.log('[MUSIC DEBUG] 取得件数:', filesData?.length || 0)
          console.log('[MUSIC DEBUG] All files from database:', filesData)
          
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
            
            console.log('[MUSIC DEBUG] === ファイルデータ読み込み開始 ===')
            console.log('[MUSIC DEBUG] 取得したファイル数:', filesData.length)
            console.log('[MUSIC DEBUG] 全ファイル情報:', filesData)
            
            for (const file of filesData) {
              console.log('[MUSIC DEBUG] 処理中のファイル:', {
                id: file.id,
                file_name: file.file_name,
                file_type: file.file_type,
                purpose: file.purpose,
                file_path: file.file_path
              })
              
              // 音楽関連のファイルを適切なフィールドにマッピング
              // ファイル拡張子でもチェックして、誤ったfile_typeを除外
              const isAudioFile = (file.file_type === 'music' || file.file_type === 'audio') && 
                                  !file.file_name.match(/\.(jpg|jpeg|png|gif|bmp)$/i)
              
              console.log('[MUSIC DEBUG] 音声ファイル判定:', isAudioFile)
              
              if (isAudioFile) {
                // purposeが設定されている場合はそれを使用
                if (file.purpose === 'music_data_path' || file.purpose === 'chaser_song') {
                  console.log('[MUSIC DEBUG] Purpose一致でマッピング:', file.purpose)
                  filesMap[file.purpose] = file
                  
                  // パブリックURLを取得（期限なし）
                  const { data: urlData } = supabase.storage
                    .from('files')
                    .getPublicUrl(file.file_path)
                  
                  if (urlData?.publicUrl) {
                    urlUpdates[file.purpose] = urlData.publicUrl
                  }
                }
                // purposeがnullまたは空の場合、ファイル名から推測
                else if (!file.purpose || file.purpose === null) {
                  // ファイルパスから目的を推測
                  if (file.file_path.includes('chaser_song')) {
                    filesMap['chaser_song'] = file
                    
                    // 署名付きURLを取得
                    const { data: urlData } = supabase.storage
                      .from('files')
                      .getPublicUrl(file.file_path)  // パブリックURL（期限なし）
                    
                    if (urlData?.publicUrl) {
                      urlUpdates['chaser_song'] = urlData.publicUrl
                    }
                  } else if (file.file_path.includes('music_data_path')) {
                    filesMap['music_data_path'] = file
                    
                    // 署名付きURLを取得
                    const { data: urlData } = supabase.storage
                      .from('files')
                      .getPublicUrl(file.file_path)  // パブリックURL（期限なし）
                    
                    if (urlData?.publicUrl) {
                      urlUpdates['music_data_path'] = urlData.publicUrl
                    }
                  }
                }
              }
            }
            
            console.log('[MUSIC DEBUG] === ファイルマッピング結果 ===')
            console.log('[MUSIC DEBUG] Final audioFiles state:', filesMap)
            console.log('[MUSIC DEBUG] Final URL updates:', urlUpdates)
            console.log('[MUSIC DEBUG] music_data_path file info:', filesMap['music_data_path'])
            console.log('[MUSIC DEBUG] chaser_song file info:', filesMap['chaser_song'])
            
            // audioFiles状態の更新をログ出力
            console.log('[MUSIC DEBUG] setAudioFiles実行前の状態')
            setAudioFiles(prev => {
              console.log('[MUSIC DEBUG] setAudioFiles - 前の状態:', prev)
              console.log('[MUSIC DEBUG] setAudioFiles - 新しい状態:', filesMap)
              return filesMap
            })
            
            // semifinalsInfo状態の更新をログ出力
            console.log('[MUSIC DEBUG] setSemifinalsInfo実行（URL更新）')
            setSemifinalsInfo(prev => {
              console.log('[MUSIC DEBUG] setSemifinalsInfo - 前の状態:', prev)
              console.log('[MUSIC DEBUG] setSemifinalsInfo - URL更新:', urlUpdates)
              const newState = { ...prev, ...urlUpdates }
              console.log('[MUSIC DEBUG] setSemifinalsInfo - 新しい状態:', newState)
              return newState
            })
          }
        } else {
          // 新規作成時の初期設定
          const initialData: Partial<SemifinalsInfo> = {
            entry_id: entry.id,
            music_change_from_preliminary: false,
            copyright_permission: '',
            choreographer_change_from_preliminary: false
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
  }, [entry?.id, supabase, showToast, debugLogger])

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

      // ファイルアップロード前に現在の入力データを一時保存
      console.log('[UPLOAD DEBUG] 現在の入力データを一時保存中...')
      try {
        // 一時保存（work_title_kanaも含める）
        const tempSaveData = {
          ...semifinalsInfo,
          entry_id: entry.id
        }
        
        console.log('[UPLOAD DEBUG] 一時保存データ:', tempSaveData)
        console.log('[UPLOAD DEBUG] work_title_kana値:', tempSaveData.work_title_kana)
        
        await save(tempSaveData)
        console.log('[UPLOAD DEBUG] 一時保存完了')
      } catch (tempSaveError) {
        console.log('[UPLOAD DEBUG] 一時保存に失敗（続行）:', tempSaveError)
      }

      // 既存のファイルがある場合は削除（audioFilesまたはsemifinalsInfoから確認）
      const hasExistingFile = audioFiles[field] || semifinalsInfo[field as keyof SemifinalsInfo]
      if (hasExistingFile) {
        console.log('[UPLOAD DEBUG] Existing file detected, deleting:', hasExistingFile)
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
      // ファイルタイプを適切に判定
      const isImageField = field.includes('image_path')
      const fileType = isImageField ? 'photo' : 'audio'
      
      const insertData = {
        entry_id: entry.id,
        file_type: fileType,
        file_name: file.name,
        file_path: fileName,
        purpose: field  // purposeフィールドを確実に設定
      }
      
      console.log('[UPLOAD DEBUG] File type determined:', fileType, 'for field:', field)
      
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
      
      // パブリックURLを取得（期限なし）
      const { data: urlData } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      // UIの状態を更新
      console.log('[UPLOAD DEBUG] Updating UI state with public URL:', urlData?.publicUrl)
      setSemifinalsInfo(prev => {
        const updated = {
          ...prev,
          [field]: urlData?.publicUrl || ''
        }
        console.log('[UPLOAD DEBUG] setSemifinalsInfo - 前の状態:', prev[field as keyof SemifinalsInfo])
        console.log('[UPLOAD DEBUG] setSemifinalsInfo - 新しい状態:', updated[field as keyof SemifinalsInfo])
        return updated
      })

      setAudioFiles(prev => ({
        ...prev,
        [field]: fileData
      }))
      
      // semifinals_infoテーブルのフィールドも更新（音楽ファイルと照明画像）
      if (entry.id) {
        // まず既存のレコードがあるか確認
        const { data: existingData } = await supabase
          .from('semifinals_info')
          .select('id')
          .eq('entry_id', entry.id)
          .maybeSingle()
        
        if (existingData) {
          // 既存レコードがある場合は更新
          const updateValue = urlData?.publicUrl || fileName
          console.log('[UPLOAD DEBUG] Updating semifinals_info with:', { field, value: updateValue })
          
          const { error: updateError } = await supabase
            .from('semifinals_info')
            .update({
              [field]: updateValue
            })
            .eq('entry_id', entry.id)
          
          if (updateError) {
            console.error('Error updating semifinals_info:', updateError)
          } else {
            console.log('[UPLOAD DEBUG] Database updated successfully for field:', field)
          }
        } else {
          // 既存レコードがない場合は作成
          const insertValue = urlData?.publicUrl || fileName
          console.log('[UPLOAD DEBUG] Inserting new semifinals_info with:', { field, value: insertValue })
          
          const { error: insertError } = await supabase
            .from('semifinals_info')
            .insert({
              entry_id: entry.id,
              [field]: insertValue
            })
          
          if (insertError) {
            console.error('Error inserting semifinals_info:', insertError)
          } else {
            console.log('[UPLOAD DEBUG] Database insert successful for field:', field)
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
      const extractFilePathFromUrl = (urlOrPath: string): string | null => {
        if (!urlOrPath) return null
        
        console.log('[DELETE DEBUG] Processing:', urlOrPath)
        
        // 既にファイルパスの場合（URLではない）
        if (!urlOrPath.startsWith('http') && !urlOrPath.includes('://')) {
          console.log('[DELETE DEBUG] Direct file path detected:', urlOrPath)
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
          console.log('[DELETE DEBUG] Extracted file path from URL:', filePath)
          
          // パス走査攻撃を防ぐ
          if (filePath.includes('../') || filePath.includes('..\\')) {
            console.error('[SECURITY] Path traversal detected')
            return null
          }
          
          // ファイルパスの形式を確認
          // パスは「entry_id/semifinals/」または「userId/entry_id/」の形式の可能性がある
          if (entry?.id) {
            const validPatterns = [
              `${userId}/${entry.id}/`,  // 新形式: userId/entryId/
              `${entry.id}/semifinals/`   // 旧形式: entryId/semifinals/
            ]
            
            const isValidPath = validPatterns.some(pattern => filePath.startsWith(pattern))
            
            if (!isValidPath) {
              console.error('[SECURITY] File path does not match expected patterns')
              console.log('[DELETE DEBUG] Expected patterns:', validPatterns)
              console.log('[DELETE DEBUG] Actual path:', filePath)
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
        
        // 新旧両方のパス形式をサポート（finalsフォルダーも含む）
        const validPrefixes = entry?.id ? [
          `${userId}/${entry.id}/`,     // 新形式
          `${entry.id}/semifinals/`,    // 旧形式（準決勝）
          `${entry.id}/finals/`         // 決勝フォルダー（準決勝で削除可能）
        ] : []
        
        const isValidPath = validPrefixes.some(prefix => pathToDelete.startsWith(prefix))
        
        if (!isValidPath) {
          console.error('[SECURITY] Attempted to delete file outside user scope')
          console.log('[DELETE DEBUG] Valid prefixes:', validPrefixes)
          console.log('[DELETE DEBUG] Path to delete:', pathToDelete)
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
        [field]: null
      }))

      setAudioFiles(prev => {
        const newFiles = { ...prev }
        delete newFiles[field]
        return newFiles
      })
      
      // semifinals_infoテーブルのフィールドもクリア（照明画像を含む）
      if (entry?.id) {
        const { error: updateError } = await supabase
          .from('semifinals_info')
          .update({
            [field]: null
          })
          .eq('entry_id', entry.id)
        
        if (updateError) {
          console.error('Error updating semifinals_info:', updateError)
        } else {
          console.log('[DELETE DEBUG] Database field cleared:', field)
        }
      }

      // 強制的に再レンダリングを促すため、少し待ってから再度確認
      setTimeout(() => {
        console.log('[DELETE DEBUG] Final UI state check:', {
          field: field,
          semifinalsInfo_value: semifinalsInfo[field as keyof SemifinalsInfo],
          audioFiles_has_field: field in audioFiles
        })
      }, 100)
      
      console.log('[DELETE DEBUG] UI state updated:', {
        field: field,
        semifinalsInfo_field_cleared: !semifinalsInfo[field as keyof SemifinalsInfo],
        audioFiles_field_removed: !audioFiles[field]
      })
      
      showToast('ファイルを削除しました', 'success')
    } catch (err) {
      console.error('ファイル削除エラー:', err)
      showToast('ファイルの削除に失敗しました', 'error')
    }
  }

  const handleSave = async () => {
    if (!entry?.id) {
      showToast('基本情報を先に保存してください', 'error')
      router.push('/dashboard/basic-info')
      return
    }

    // バリデーションはステータスチェック用のみ（保存は常に可能）
    // 50文字制限のチェックのみ実施
    if (semifinalsInfo.work_character_story && semifinalsInfo.work_character_story.length > 50) {
      showToast('作品キャラクター・ストーリー等は50文字以内で入力してください', 'error')
      return
    }

    // 保存データを準備（work_title_kanaも含める）
    const dataToSave = {
      ...semifinalsInfo,
      entry_id: entry.id
    }
    
    debugLogger.log('SEMIFINALS SAVE', '準決勝情報保存開始', {
      work_title: dataToSave.work_title,
      work_title_kana: dataToSave.work_title_kana,
      music_change_from_preliminary: dataToSave.music_change_from_preliminary,
      entry_id: dataToSave.entry_id,
      dataSize: Object.keys(dataToSave).length
    })

    try {
      await save(dataToSave) // 保存
      
      debugLogger.log('SEMIFINALS SAVE', '準決勝情報保存完了', {
        message: '保存処理完了',
        work_title_kana_saved: dataToSave.work_title_kana
      })
    } catch (saveError) {
      alert(`保存エラー: ${saveError}`)
      console.error('保存エラー詳細:', saveError)
      throw saveError
    }
    
    // 必須項目が完了している場合はステータスを「登録済み」に更新
    const isComplete = await checkSemifinalsInfoCompletion(semifinalsInfo, entry.id)
    await updateFormStatus('semifinals_info', entry.id, isComplete)
    
    // 保存成功後にダッシュボードにリダイレクト
    showToast('準決勝情報を保存しました', 'success')
    
    // ログ保存を確実にするため少し待機
    debugLogger.log('SEMIFINALS REDIRECT', 'ダッシュボードにリダイレクト開始')
    setTimeout(() => {
      debugLogger.log('SEMIFINALS REDIRECT', 'ダッシュボードにリダイレクト実行')
      // リダイレクト前にlocalStorageの保存を確認
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 100)
    }, 1500)
    
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
          audioFiles={audioFiles}
        />
      )}

      {activeSection === 'sound' && (
        <SoundSection
          semifinalsInfo={semifinalsInfo}
          validationErrors={validationErrors.sound || []}
          onChange={handleFieldChange}
          onFileUpload={handleFileUpload}
          onFileDelete={handleFileDelete}
          audioFiles={audioFiles}
        />
      )}

      {activeSection === 'lighting' && (
        <LightingSection
          semifinalsInfo={semifinalsInfo}
          validationErrors={validationErrors.lighting || []}
          onChange={handleFieldChange}
          onFileUpload={handleFileUpload}
          onFileDelete={handleFileDelete}
        />
      )}

      {activeSection === 'choreographer' && (
        <ChoreographerSection
          semifinalsInfo={semifinalsInfo}
          preliminaryInfo={preliminaryInfo}
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
          <SaveButton
            onClick={handleSave}
            disabled={saving || !entry}
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