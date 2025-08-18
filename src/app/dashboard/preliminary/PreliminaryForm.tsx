'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { FormField, SaveButton, CancelButton, Alert, DeadlineNoticeAsync } from '@/components/ui'
import { FileUploadField } from '@/components/ui/FileUploadField'
import { useFormSave, useFormValidation, useFileUploadV2 } from '@/hooks'
import type { PreliminaryInfo, EntryFile } from '@/lib/types'

interface PreliminaryFormProps {
  entryId: string | null
  initialData: PreliminaryInfo | null
  preliminaryVideo: EntryFile | null
  userId: string
}

export default function PreliminaryForm({ entryId, initialData, preliminaryVideo, userId }: PreliminaryFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    work_title: initialData?.work_title || '',
    work_title_kana: initialData?.work_title_kana || '',
    work_story: initialData?.work_story || '',
    music_rights_cleared: initialData?.music_rights_cleared || 'A',
    music_title: initialData?.music_title || '',
    cd_title: initialData?.cd_title || '',
    artist: initialData?.artist || '',
    record_number: initialData?.record_number || '',
    jasrac_code: initialData?.jasrac_code || '',
    music_type: initialData?.music_type || 'cd',
    choreographer1_name: initialData?.choreographer1_name || '',
    choreographer1_furigana: initialData?.choreographer1_furigana || '',
    choreographer2_name: initialData?.choreographer2_name || '',
    choreographer2_furigana: initialData?.choreographer2_furigana || ''
  })
  
  const [videoFile, setVideoFile] = useState<EntryFile | null>(preliminaryVideo)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  // バリデーションルール
  const validationRules = {
    work_title: { required: true },
    work_title_kana: { required: true },
    work_story: { required: true, maxLength: 50 },
    music_title: { required: true },
    cd_title: { required: true },
    artist: { required: true },
    record_number: { required: true },
    jasrac_code: { required: true },
    music_type: { required: true },
    music_rights_cleared: { required: true },
    choreographer1_name: { required: true },
    choreographer1_furigana: { required: true }
  }

  const { errors, validateSingleField } = useFormValidation(formData, validationRules)

  // フォーム保存フック
  const { save, saving, error, success } = useFormSave({
    tableName: 'preliminary_info',
    uniqueField: 'entry_id',
    redirectPath: '/dashboard',
    onSuccess: (message) => showToast(message, 'success'),
    onError: (error) => showToast(error, 'error')
  })
  
  // ファイルアップロードフック
  const { uploadVideo, uploading, deleteFile } = useFileUploadV2({
    category: 'video',
    onSuccess: async (result: { url?: string; path?: string }) => {
      if (result.path) {
        // ファイル情報をデータベースに保存
        await saveVideoFileInfo(result.path)
        
        // 署名付きURLを取得してプレビューを更新
        const { data } = await supabase.storage
          .from('files')
          .createSignedUrl(result.path, 3600)
        if (data?.signedUrl) {
          setVideoUrl(data.signedUrl)
        }
      }
    },
    onError: (error: string) => showToast(error, 'error')
  })

  // 動画ファイルの状態と署名付きURLを管理
  useEffect(() => {
    if (preliminaryVideo) {
      console.log('[VIDEO] Setting video file from preliminaryVideo:', preliminaryVideo)
      setVideoFile(preliminaryVideo)
      
      if (preliminaryVideo.file_path) {
        console.log('[VIDEO] Fetching signed URL for:', preliminaryVideo.file_path)
        // 署名付きURLを取得
        const getVideoUrl = async () => {
          try {
            const { data, error } = await supabase.storage
              .from('files')
              .createSignedUrl(preliminaryVideo.file_path, 3600)
            
            if (error) {
              console.error('[VIDEO] Error getting signed URL:', error)
              return
            }
            
            if (data?.signedUrl) {
              console.log('[VIDEO] Got signed URL successfully')
              setVideoUrl(data.signedUrl)
            } else {
              console.warn('[VIDEO] No signed URL returned')
            }
          } catch (err) {
            console.error('[VIDEO] Exception getting signed URL:', err)
          }
        }
        getVideoUrl()
      } else {
        console.log('[VIDEO] No file_path in preliminaryVideo')
      }
    } else {
      console.log('[VIDEO] No preliminaryVideo provided')
    }
  }, [preliminaryVideo?.id, preliminaryVideo?.file_path]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // リアルタイムバリデーション
    validateSingleField(field, value)
  }

  const saveVideoFileInfo = async (filePath: string) => {
    try {
      const { data: fileData, error: dbError } = await supabase
        .from('entry_files')
        .insert({
          entry_id: entryId,
          file_type: 'video',
          file_name: filePath.split('/').pop() || '',
          file_path: filePath,
          purpose: 'preliminary'
        })
        .select()
        .single()

      if (dbError) throw dbError

      setVideoFile(fileData)
      showToast('予選動画をアップロードしました', 'success')
      return fileData
    } catch (error) {
      console.error('Error saving file info:', error)
      showToast('ファイル情報の保存に失敗しました', 'error')
      throw error
    }
  }
  
  const handleFileUpload = async (file: File) => {
    if (!entryId) {
      showToast('基本情報を先に保存してください', 'error')
      return
    }

    if (videoFile) {
      showToast('既に動画がアップロードされています。新しい動画をアップロードするには、先に既存の動画を削除してください。', 'error')
      return
    }

    // ファイルアップロード前に現在の入力データを一時保存
    try {
      await save({ ...formData, entry_id: entryId })
      console.log('[PRELIMINARY UPLOAD] 一時保存完了')
    } catch (tempSaveError) {
      console.log('[PRELIMINARY UPLOAD] 一時保存に失敗（続行）:', tempSaveError)
    }

    await uploadVideo(file, { entryId, userId, folder: 'preliminary' })
  }

  const handleFileDelete = async () => {
    if (!videoFile || !window.confirm('予選動画を削除してもよろしいですか？')) return

    try {
      // 即座にUIを更新（楽観的更新）
      const tempVideoFile = videoFile
      const tempVideoUrl = videoUrl
      setVideoFile(null)
      setVideoUrl(null)
      
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
          setVideoFile(tempVideoFile)
          setVideoUrl(tempVideoUrl)
          throw dbError
        }

        showToast('予選動画を削除しました', 'success')
      } else {
        // エラーの場合は元に戻す
        setVideoFile(tempVideoFile)
        setVideoUrl(tempVideoUrl)
        throw new Error('ファイルの削除に失敗しました')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      showToast('削除に失敗しました', 'error')
    }
  }

  const handleSave = async () => {
    if (!entryId) {
      showToast('基本情報を先に保存してください', 'error')
      router.push('/dashboard/basic-info')
      return
    }

    // バリデーションはステータスチェック用のみ（保存は常に可能）

    const dataToSave = {
      entry_id: entryId,
      ...formData,
      video_submitted: !!videoFile
    }

    // デバッグ: 保存するデータをログ出力
    console.log('=== 予選情報 保存データ ===')
    console.log('formData:', JSON.stringify(formData, null, 2))
    console.log('dataToSave:', JSON.stringify(dataToSave, null, 2))
    console.log('全フィールド:')
    Object.keys(dataToSave).forEach(key => {
      console.log(`  ${key}: ${dataToSave[key as keyof typeof dataToSave]}`)
    })
    console.log('========================')

    await save(dataToSave) // 保存
    
    // 保存成功メッセージを表示
    showToast('予選情報を保存しました', 'success')
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <DeadlineNoticeAsync deadlineKey="music_info_deadline" />

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          予選情報の登録
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          予選で使用する作品情報と楽曲の著作権情報を入力してください。
        </p>
      </div>

      <div className="space-y-6">
        {/* 作品情報セクション */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h4 className="text-base font-medium text-gray-900">作品情報</h4>
          
          <FormField
            label="作品タイトル"
            name="work_title"
            value={formData.work_title}
            onChange={(e) => handleFieldChange('work_title', e.target.value)}
            required
            placeholder="例：情熱のタンゴ"
            error={errors.work_title}
          />

          <FormField
            label="作品タイトル(ふりがな)"
            name="work_title_kana"
            value={formData.work_title_kana}
            onChange={(e) => handleFieldChange('work_title_kana', e.target.value)}
            required
            placeholder="例：じょうねつのたんご"
            error={errors.work_title_kana}
          />

          <FormField
            label="作品キャラクター・ストーリー等（50字以内）"
            name="work_story"
            type="textarea"
            value={formData.work_story}
            onChange={(e) => handleFieldChange('work_story', e.target.value)}
            required
            maxLength={50}
            rows={2}
            placeholder="作品の概要やキャラクター設定などを簡潔に"
            error={errors.work_story}
          />
        </div>

        {/* 予選提出動画セクション */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-base font-medium text-gray-900 mb-4">
            予選提出動画 <span className="text-red-500">*</span>
          </h4>
          
          {!videoFile && (
            <p className="text-sm text-red-600 mb-4">予選動画のアップロードは必須です</p>
          )}
          
          {videoFile ? (
            <div className="space-y-4">
              {/* 動画プレビュー */}
              {videoUrl ? (
                <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg overflow-hidden border border-indigo-200">
                  <div className="aspect-video">
                    <video
                      controls
                      className="w-full h-full object-contain bg-black"
                      src={videoUrl}
                      key={`${videoFile.id}_${videoUrl}`}
                    >
                      お使いのブラウザは動画タグをサポートしていません。
                    </video>
                  </div>
                </div>
              ) : (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 p-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className="animate-spin h-8 w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500">動画を読み込んでいます...</p>
                  </div>
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
                        {videoFile.file_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ビデオファイル • {videoFile.file_size && `${(videoFile.file_size / 1024 / 1024).toFixed(2)} MB`}
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
                    onClick={handleFileDelete}
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
              
              {/* アップロード完了メッセージ */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      予選動画のアップロードが完了しました
                    </p>
                    <p className="mt-1 text-sm text-green-700">
                      動画は1つのみアップロード可能です。変更する場合は現在の動画を削除してから新しい動画をアップロードしてください。
                    </p>
                    <p className="mt-1 text-sm font-medium text-green-800">
                      この動画は予選提出に必須です。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <FileUploadField
              label="予選提出動画"
              value={null}
              onChange={handleFileUpload}
              category="video"
              disabled={uploading || !!videoFile || !entryId}
              required
              maxSizeMB={500}
              accept="video/*"
              placeholder={{
                title: "予選提出動画をドラッグ&ドロップ",
                formats: "対応形式: MP4, MOV, AVI など（最大500MB）"
              }}
            />
          )}
        </div>

        {/* 楽曲著作権情報セクション */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h4 className="text-base font-medium text-gray-900">楽曲著作権情報</h4>
          
          <div className="space-y-4">
            {/* 楽曲著作権許諾 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                楽曲著作権許諾 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="music_rights_cleared"
                    value="A"
                    checked={formData.music_rights_cleared === 'A'}
                    onChange={(e) => handleFieldChange('music_rights_cleared', e.target.value)}
                    required
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    A.市販の楽曲を使用する
                  </span>
                </label>
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="music_rights_cleared"
                    value="B"
                    checked={formData.music_rights_cleared === 'B'}
                    onChange={(e) => handleFieldChange('music_rights_cleared', e.target.value)}
                    required
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    B.自身で著作権に対し許諾を取った楽曲を使用する
                  </span>
                </label>
                <label className="flex items-start">
                  <input
                    type="radio"
                    name="music_rights_cleared"
                    value="C"
                    checked={formData.music_rights_cleared === 'C'}
                    onChange={(e) => handleFieldChange('music_rights_cleared', e.target.value)}
                    required
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    C.独自に製作されたオリジナル楽曲を使用する
                  </span>
                </label>
              </div>
              {errors.music_rights_cleared && (
                <p className="mt-1 text-sm text-red-600">{errors.music_rights_cleared}</p>
              )}
            </div>

            <FormField
              label="使用楽曲タイトル"
              name="music_title"
              value={formData.music_title}
              onChange={(e) => handleFieldChange('music_title', e.target.value)}
              required
              placeholder="楽曲名"
              error={errors.music_title}
            />

            <FormField
              label="収録CDタイトル"
              name="cd_title"
              value={formData.cd_title}
              onChange={(e) => handleFieldChange('cd_title', e.target.value)}
              required
              placeholder="CD/アルバム名"
              error={errors.cd_title}
            />

            <FormField
              label="アーティスト"
              name="artist"
              value={formData.artist}
              onChange={(e) => handleFieldChange('artist', e.target.value)}
              required
              placeholder="アーティスト名"
              error={errors.artist}
            />

            <FormField
              label="レコード番号"
              name="record_number"
              value={formData.record_number}
              onChange={(e) => handleFieldChange('record_number', e.target.value)}
              required
              placeholder="例：ABCD-12345"
              error={errors.record_number}
            />

            <FormField
              label="JASRAC作品コード"
              name="jasrac_code"
              value={formData.jasrac_code}
              onChange={(e) => handleFieldChange('jasrac_code', e.target.value)}
              required
              placeholder="例：123-4567-8"
              error={errors.jasrac_code}
            />

            <FormField
              label="楽曲種類"
              name="music_type"
              type="select"
              value={formData.music_type}
              onChange={(e) => handleFieldChange('music_type', e.target.value)}
              required
              error={errors.music_type}
            >
              <option value="">選択してください</option>
              <option value="cd">CD楽曲</option>
              <option value="download">データダウンロード楽曲</option>
              <option value="other">その他（オリジナル曲）</option>
            </FormField>
          </div>
        </div>

        {/* 振付師情報セクション */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h4 className="text-base font-medium text-gray-900">振付師情報</h4>
          
          <FormField
            label="予選 - 振付師1"
            name="choreographer1_name"
            value={formData.choreographer1_name}
            onChange={(e) => handleFieldChange('choreographer1_name', e.target.value)}
            required
            placeholder="例：山田太郎"
            error={errors.choreographer1_name}
          />

          <FormField
            label="予選 - 振付師1 フリガナ"
            name="choreographer1_furigana"
            value={formData.choreographer1_furigana}
            onChange={(e) => handleFieldChange('choreographer1_furigana', e.target.value)}
            required
            placeholder="例：ヤマダタロウ"
            error={errors.choreographer1_furigana}
          />

          <FormField
            label="予選 - 振付師2"
            name="choreographer2_name"
            value={formData.choreographer2_name}
            onChange={(e) => handleFieldChange('choreographer2_name', e.target.value)}
            placeholder="例：佐藤花子"
            error={errors.choreographer2_name}
          />

          <FormField
            label="予選 - 振付師2 フリガナ"
            name="choreographer2_furigana"
            value={formData.choreographer2_furigana}
            onChange={(e) => handleFieldChange('choreographer2_furigana', e.target.value)}
            placeholder="例：サトウハナコ"
            error={errors.choreographer2_furigana}
          />
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <CancelButton onClick={() => router.push('/dashboard')} />
        <div className="space-x-4">
          <SaveButton
            onClick={handleSave}
            disabled={saving || uploading}
            loading={saving}
          />
        </div>
      </div>
    </form>
  )
}