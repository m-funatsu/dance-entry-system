'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { FormField, FileUploadField, Alert, SaveButton, DeadlineNoticeAsync } from '@/components/ui'
import { StartDateNotice } from '@/components/ui/StartDateNotice'
import { useBaseForm } from '@/hooks'
import { useFileUploadV2 } from '@/hooks/useFileUploadV2'
import { ValidationPresets } from '@/lib/validation'
import { updateFormStatus, checkSnsInfoCompletion } from '@/lib/status-utils'
import type { Entry, SnsFormData, EntryFile } from '@/lib/types'

interface SNSFormProps {
  userId: string
  entry: Entry | null
}

export default function SNSForm({ entry, userId }: SNSFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  
  // 入力開始日制御
  const [isStartDateAvailable, setIsStartDateAvailable] = useState(false)

  const handleAvailabilityChange = useCallback((isAvailable: boolean) => {
    setIsStartDateAvailable(isAvailable)
  }, [])
  
  // 動画ファイル状態管理
  const [practiceVideoFile, setPracticeVideoFile] = useState<EntryFile | null>(null)
  const [practiceVideoUrl, setPracticeVideoUrl] = useState<string | null>(null)
  const [introVideoFile, setIntroVideoFile] = useState<EntryFile | null>(null)
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null)

  // フォームの初期データ
  const initialData: SnsFormData = {
    entry_id: entry?.id || '',
    practice_video_path: '',
    practice_video_filename: '',
    introduction_highlight_path: '',
    introduction_highlight_filename: '',
    sns_notes: ''
  }

  // バリデーションルール（新しいヘルパーを使用）
  const validationRules = {
    practice_video_path: ValidationPresets.requiredFile('練習風景動画をアップロードしてください'),
    introduction_highlight_path: ValidationPresets.requiredFile('選手紹介・見所動画をアップロードしてください'),
    sns_notes: ValidationPresets.optionalText(500)
  }

  // useBaseFormフックを使用
  const {
    formData,
    handleFieldChange,
    save,
    saving,
    error,
    success,
    setError,
    loading: formLoading
  } = useBaseForm<SnsFormData>({
    initialData,
    tableName: 'sns_info',
    uniqueField: 'entry_id',
    validationRules,
    redirectPath: undefined, // 自動リダイレクト無効化
    onSuccess: (message) => console.log('Save success:', message),
    onError: (error) => showToast(error, 'error')
  })

  // ファイルアップロードフック（新システム）
  const { uploadVideo, uploading, progress, deleteFile } = useFileUploadV2({
    category: 'video',
    onError: (error: string) => showToast(error, 'error')
  })

  // データを読み込む
  useEffect(() => {
    if (!entry?.id) {
      setLoading(false)
      return
    }
    
    const loadData = async () => {
      try {
        // SNS情報を取得
        const { data: snsData } = await supabase
          .from('sns_info')
          .select('*')
          .eq('entry_id', entry.id)
          .maybeSingle()
        
        // 動画ファイル情報を取得
        const { data: files } = await supabase
          .from('entry_files')
          .select('*')
          .eq('entry_id', entry.id)
          .in('purpose', ['sns_practice_video', 'sns_introduction_highlight'])
          .eq('file_type', 'video')
        
        if (snsData) {
          // formDataを更新
          Object.keys(snsData).forEach(key => {
            if (key in formData) {
              handleFieldChange(key as keyof SnsFormData, snsData[key])
            }
          })
        }
        
        // 動画ファイルを設定
        if (files && files.length > 0) {
          for (const file of files) {
            if (file.purpose === 'sns_practice_video') {
              setPracticeVideoFile(file)
              // 署名付きURLを取得
              const { data } = await supabase.storage
                .from('files')
                .createSignedUrl(file.file_path, 3600)
              if (data?.signedUrl) {
                setPracticeVideoUrl(data.signedUrl)
              }
            } else if (file.purpose === 'sns_introduction_highlight') {
              setIntroVideoFile(file)
              // 署名付きURLを取得
              const { data } = await supabase.storage
                .from('files')
                .createSignedUrl(file.file_path, 3600)
              if (data?.signedUrl) {
                setIntroVideoUrl(data.signedUrl)
              }
            }
          }
        }
      } catch {
        setError('データの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [entry?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveVideoFileInfo = async (filePath: string, field: 'practice_video' | 'introduction_highlight') => {
    try {
      const { data: fileData, error: dbError } = await supabase
        .from('entry_files')
        .insert({
          entry_id: entry?.id,
          file_type: 'video',
          file_name: filePath.split('/').pop() || '',
          file_path: filePath,
          purpose: `sns_${field}`
        })
        .select()
        .single()

      if (dbError) throw dbError

      if (field === 'practice_video') {
        setPracticeVideoFile(fileData)
      } else {
        setIntroVideoFile(fileData)
      }
      
      showToast(`${field === 'practice_video' ? '練習風景' : '選手紹介・見所'}動画をアップロードしました`, 'success')
      return fileData
    } catch (error) {
      console.error('Error saving file info:', error)
      showToast('ファイル情報の保存に失敗しました', 'error')
      throw error
    }
  }
  
  const handleFileUpload = async (field: 'practice_video' | 'introduction_highlight', file: File) => {
    if (!entry?.id) {
      showToast('基本情報を先に保存してください', 'error')
      return
    }

    // 既存の動画がある場合はエラー
    if ((field === 'practice_video' && practiceVideoFile) || 
        (field === 'introduction_highlight' && introVideoFile)) {
      showToast('既に動画がアップロードされています。新しい動画をアップロードするには、先に既存の動画を削除してください。', 'error')
      return
    }

    try {
      const result = await uploadVideo(file, { entryId: entry.id, userId, folder: `sns/${field}` })
      
      if (result.success && result.path) {
        // ファイル情報をデータベースに保存
        await saveVideoFileInfo(result.path, field)
        
        // 署名付きURLを取得してプレビューを更新
        const { data } = await supabase.storage
          .from('files')
          .createSignedUrl(result.path, 3600)
          
        if (data?.signedUrl) {
          if (field === 'practice_video') {
            setPracticeVideoUrl(data.signedUrl)
          } else if (field === 'introduction_highlight') {
            setIntroVideoUrl(data.signedUrl)
          }
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      showToast('アップロードに失敗しました', 'error')
    }
  }

  const handleFileDelete = async (field: 'practice_video' | 'introduction_highlight') => {
    const videoFile = field === 'practice_video' ? practiceVideoFile : introVideoFile
    if (!videoFile || !window.confirm(`${field === 'practice_video' ? '練習風景' : '選手紹介・見所'}動画を削除してもよろしいですか？`)) return

    try {
      // 即座にUIを更新（楽観的更新）
      if (field === 'practice_video') {
        setPracticeVideoFile(null)
        setPracticeVideoUrl(null)
      } else {
        setIntroVideoFile(null)
        setIntroVideoUrl(null)
      }
      
      // ストレージから削除
      const deleteSuccess = await deleteFile(videoFile.file_path)
      
      if (deleteSuccess) {
        // データベースから削除
        const { error: dbError } = await supabase
          .from('entry_files')
          .delete()
          .eq('id', videoFile.id)

        if (dbError) {
          // エラーの場合は元に戻す
          if (field === 'practice_video') {
            setPracticeVideoFile(videoFile)
            // URLを再取得
            const { data } = await supabase.storage
              .from('files')
              .createSignedUrl(videoFile.file_path, 3600)
            if (data?.signedUrl) {
              setPracticeVideoUrl(data.signedUrl)
            }
          } else {
            setIntroVideoFile(videoFile)
            // URLを再取得
            const { data } = await supabase.storage
              .from('files')
              .createSignedUrl(videoFile.file_path, 3600)
            if (data?.signedUrl) {
              setIntroVideoUrl(data.signedUrl)
            }
          }
          throw dbError
        }

        // 削除後の動画ファイルの状態を確認
        // （UIは既に更新されているので、現在の状態を直接確認）
        const remainingPracticeVideo = field === 'practice_video' ? null : practiceVideoFile
        const remainingIntroVideo = field === 'introduction_highlight' ? null : introVideoFile
        
        // 両方の動画が削除された場合、sns_infoテーブルのエントリーを削除
        if (!remainingPracticeVideo && !remainingIntroVideo && entry?.id) {
          // sns_infoテーブルからエントリーを削除（存在する場合）
          const { error: deleteError } = await supabase
            .from('sns_info')
            .delete()
            .eq('entry_id', entry.id)
          
          if (deleteError) {
            console.error('Error deleting sns_info entry:', deleteError)
            // エラーがあってもユーザーへの通知は続行
          }
        }

        showToast(`${field === 'practice_video' ? '練習風景' : '選手紹介・見所'}動画を削除しました`, 'success')
      } else {
        throw new Error('ファイルの削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      showToast('削除に失敗しました', 'error')
    }
  }

  const handleSave = async () => {
    if (!entry?.id) {
      showToast('基本情報を先に保存してください', 'error')
      router.push('/dashboard/basic-info')
      return
    }

    // バリデーションはステータスチェック用のみ（保存は常に可能）
    await save(true) // 一時保存モード（バリデーション無し）
    
    // 必須項目が完了している場合はステータスを「登録済み」に更新
    const isComplete = checkSnsInfoCompletion(formData, !!practiceVideoFile, !!introVideoFile)
    await updateFormStatus('sns_info', entry.id, isComplete)
    
    // 保存成功後に同じページをリロード
    showToast('SNS情報を保存しました', 'success')
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  if (loading || formLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <>
      <StartDateNotice 
        section="sns"
        onAvailabilityChange={handleAvailabilityChange}
      />
      
      {/* 入力開始日後のみフォーム表示 */}
      {isStartDateAvailable && (
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <DeadlineNoticeAsync deadlineKey="sns_deadline" />

          <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          SNS掲載情報の登録
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          SNS掲載に使用する動画や情報をアップロードしてください。
        </p>
      </div>

      <div className="space-y-6">

        {/* 練習風景動画 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-base font-medium text-gray-900 mb-4">
            練習風景（約30秒）横長動画 <span className="text-red-500">*</span>
          </h4>
          
          {!practiceVideoFile && (
            <p className="text-sm text-red-600 mb-4">練習風景動画のアップロードは必須です</p>
          )}
          
          {practiceVideoFile ? (
            <div className="space-y-4">
              {/* 動画プレビュー */}
              {practiceVideoUrl ? (
                <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg overflow-hidden border border-indigo-200">
                  <div className="aspect-video">
                    <video
                      controls
                      className="w-full h-full object-contain bg-black"
                      src={practiceVideoUrl}
                      key={practiceVideoFile.id}
                    >
                      お使いのブラウザは動画タグをサポートしていません。
                    </video>
                  </div>
                </div>
              ) : (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">動画を読み込んでいます...</p>
                </div>
              )}
              
              {/* ファイル情報 */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {practiceVideoFile.file_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ビデオファイル • {practiceVideoFile.file_size && `${(practiceVideoFile.file_size / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        アップロード完了
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFileDelete('practice_video')}
                    disabled={uploading}
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    削除
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* アップロード中のプログレスバー */}
              {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium text-blue-800">
                      動画をアップロード中... {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <FileUploadField
                label="練習風景動画"
                value={null}
                onChange={(file) => handleFileUpload('practice_video', file)}
                category="video"
                disabled={uploading || !!practiceVideoFile || !entry}
                required
                maxSizeMB={50}
                accept="video/*"
                placeholder={{
                  title: "練習風景動画をドラッグ&ドロップ",
                  formats: "対応形式: MP4, MOV, AVI など"
                }}
              />
            </>
          )}
        </div>

        {/* 選手紹介・見所動画 */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-base font-medium text-gray-900 mb-4">
            選手紹介・見所（30秒） <span className="text-red-500">*</span>
          </h4>
          
          {!introVideoFile && (
            <p className="text-sm text-red-600 mb-4">選手紹介・見所動画のアップロードは必須です</p>
          )}
          
          {introVideoFile ? (
            <div className="space-y-4">
              {/* 動画プレビュー */}
              {introVideoUrl ? (
                <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg overflow-hidden border border-indigo-200">
                  <div className="aspect-video">
                    <video
                      controls
                      className="w-full h-full object-contain bg-black"
                      src={introVideoUrl}
                      key={introVideoFile.id}
                    >
                      お使いのブラウザは動画タグをサポートしていません。
                    </video>
                  </div>
                </div>
              ) : (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">動画を読み込んでいます...</p>
                </div>
              )}
              
              {/* ファイル情報 */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {introVideoFile.file_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ビデオファイル • {introVideoFile.file_size && `${(introVideoFile.file_size / 1024 / 1024).toFixed(2)} MB`}
                      </p>
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        アップロード完了
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFileDelete('introduction_highlight')}
                    disabled={uploading}
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    削除
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* アップロード中のプログレスバー */}
              {uploading && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium text-blue-800">
                      動画をアップロード中... {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <FileUploadField
                label="選手紹介・見所動画"
                value={null}
                onChange={(file) => handleFileUpload('introduction_highlight', file)}
                category="video"
                disabled={uploading || !!introVideoFile || !entry}
                required
                maxSizeMB={50}
                accept="video/*"
                placeholder={{
                  title: "選手紹介・見所動画をドラッグ&ドロップ",
                  formats: "対応形式: MP4, MOV, AVI など"
                }}
              />
            </>
          )}
        </div>

        {/* 備考 */}
        <FormField
          label="備考"
          name="sns_notes"
          type="textarea"
          value={formData.sns_notes || ''}
          onChange={(e) => handleFieldChange('sns_notes', e.target.value)}
          rows={4}
          placeholder="SNS掲載に関する希望や注意事項があれば記入してください"
        />

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            ※ アップロードいただいた動画は、大会公式SNSでの告知や結果発表時に使用させていただく場合があります。
          </p>
        </div>

        {!entry && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              基本情報を先に保存してください。
            </p>
          </div>
        )}

        {/* ボタン */}
        <div className="flex justify-end pt-6">
          <SaveButton
            onClick={handleSave}
            disabled={saving || uploading || !entry}
            loading={saving}
          />
        </div>
        </div>
      </form>
      )}
    </>
  )
}