'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // デバッグ用
  if (preliminaryVideo) {
    console.log('Preliminary video:', preliminaryVideo)
    console.log('Video URL:', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${preliminaryVideo.file_path}`)
  }
  
  const [formData, setFormData] = useState({
    work_title: initialData?.work_title || '',
    work_story: initialData?.work_story || '',
    music_rights_cleared: initialData?.music_rights_cleared || 'A',
    music_title: initialData?.music_title || '',
    cd_title: initialData?.cd_title || '',
    artist: initialData?.artist || '',
    record_number: initialData?.record_number || '',
    jasrac_code: initialData?.jasrac_code || '',
    music_type: initialData?.music_type || 'cd'
  })
  
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [savingMode, setSavingMode] = useState<'save' | 'submit'>('save')

  const handleSubmit = async (e: React.FormEvent, mode: 'save' | 'submit') => {
    e.preventDefault()

    if (!entryId) {
      showToast('基本情報を先に保存してください', 'error')
      router.push('/dashboard/basic-info')
      return
    }

    // 完了登録の場合は動画が必須
    if (mode === 'submit' && !preliminaryVideo) {
      showToast('予選動画をアップロードしてください', 'error')
      return
    }

    setSaving(true)
    setSavingMode(mode)

    try {
      const dataToSave = {
        entry_id: entryId,
        ...formData,
        video_submitted: !!preliminaryVideo,
        updated_at: new Date().toISOString()
      }

      if (initialData) {
        // 更新
        const { error } = await supabase
          .from('preliminary_info')
          .update(dataToSave)
          .eq('id', initialData.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('preliminary_info')
          .insert(dataToSave)

        if (error) throw error
      }

      // 完了登録の場合はエントリーステータスを更新
      if (mode === 'submit') {
        const { error: entryError } = await supabase
          .from('entries')
          .update({ 
            status: 'submitted',
            updated_at: new Date().toISOString()
          })
          .eq('id', entryId)

        if (entryError) throw entryError
      }

      showToast(
        mode === 'submit' 
          ? '予選情報を登録しました' 
          : '予選情報を一時保存しました', 
        'success'
      )
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving preliminary info:', error)
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 既に動画がアップロードされている場合はエラー
    if (preliminaryVideo) {
      showToast('既に動画がアップロードされています。新しい動画をアップロードするには、先に既存の動画を削除してください。', 'error')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // ファイルサイズチェック（200MB）
    const maxSize = 200 * 1024 * 1024
    if (file.size > maxSize) {
      showToast('ファイルサイズが200MBを超えています', 'error')
      return
    }

    // ファイル形式チェック
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/mov']
    if (!allowedTypes.includes(file.type)) {
      showToast('MP4、MOV、AVI形式のファイルを選択してください', 'error')
      return
    }

    if (!entryId) {
      showToast('基本情報を先に保存してください', 'error')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // ファイル名をサニタイズ
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileName = `preliminary_${userId}_${timestamp}_${sanitizedName}`

      // アップロード
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // ファイル情報をデータベースに保存
      const { error: dbError } = await supabase
        .from('entry_files')
        .insert({
          entry_id: entryId,
          file_type: 'video',
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          purpose: 'preliminary'
        })

      if (dbError) throw dbError

      showToast('予選動画をアップロードしました', 'success')
      router.refresh()
    } catch (error) {
      console.error('Error uploading file:', error)
      showToast('アップロードに失敗しました', 'error')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileDelete = async () => {
    if (!preliminaryVideo || !window.confirm('予選動画を削除してもよろしいですか？')) return

    setUploading(true)
    try {
      // ストレージから削除
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([preliminaryVideo.file_path])

      if (storageError) throw storageError

      // データベースから削除
      const { error: dbError } = await supabase
        .from('entry_files')
        .delete()
        .eq('id', preliminaryVideo.id)

      if (dbError) throw dbError

      showToast('予選動画を削除しました', 'success')
      router.refresh()
    } catch (error) {
      console.error('Error deleting file:', error)
      showToast('削除に失敗しました', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
          
          <div>
            <label htmlFor="work_title" className="block text-sm font-medium text-gray-700">
              作品タイトルまたはテーマ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="work_title"
              value={formData.work_title}
              onChange={(e) => setFormData({ ...formData, work_title: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例：情熱のタンゴ"
            />
          </div>

          <div>
            <label htmlFor="work_story" className="block text-sm font-medium text-gray-700">
              作品キャラクター・ストーリー等（50字以内） <span className="text-red-500">*</span>
            </label>
            <textarea
              id="work_story"
              value={formData.work_story}
              onChange={(e) => setFormData({ ...formData, work_story: e.target.value })}
              required
              maxLength={50}
              rows={2}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="作品の概要やキャラクター設定などを簡潔に"
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.work_story.length}/50文字
            </p>
          </div>
        </div>

        {/* 予選提出動画セクション */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-base font-medium text-gray-900 mb-4">
            予選提出動画 <span className="text-red-500">*</span>
          </h4>
          
          {preliminaryVideo ? (
            <div className="space-y-4">
              {/* 動画プレビュー */}
              <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg overflow-hidden border border-indigo-200">
                <div className="aspect-video">
                  <video
                    controls
                    className="w-full h-full object-contain bg-black"
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/files/${preliminaryVideo.file_path}`}
                    key={preliminaryVideo.id}
                  >
                    お使いのブラウザは動画タグをサポートしていません。
                  </video>
                </div>
              </div>
              
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
                        {preliminaryVideo.file_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        ビデオファイル • {preliminaryVideo.file_size && `${(preliminaryVideo.file_size / 1024 / 1024).toFixed(2)} MB`}
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
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/avi,video/mov"
                onChange={handleFileUpload}
                disabled={uploading || !!preliminaryVideo}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all duration-200 ${
                  uploading || preliminaryVideo ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25H13.5" />
                </svg>
                <span className="mt-2 block text-sm font-semibold text-gray-900">
                  {uploading ? 'アップロード中...' : 'クリックして動画を選択'}
                </span>
                <span className="mt-1 block text-xs text-gray-600">
                  またはドラッグ＆ドロップ
                </span>
                <span className="mt-2 block text-xs text-gray-500">
                  MP4、MOV、AVI形式（最大200MB）
                </span>
              </label>
            </div>
          )}
          
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">アップロード中</span>
                <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
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
                    onChange={(e) => setFormData({ ...formData, music_rights_cleared: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, music_rights_cleared: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, music_rights_cleared: e.target.value })}
                    required
                    className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    C.独自に製作されたオリジナル楽曲を使用する
                  </span>
                </label>
              </div>
            </div>

            {/* 使用楽曲タイトル */}
            <div>
              <label htmlFor="music_title" className="block text-sm font-medium text-gray-700">
                使用楽曲タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="music_title"
                value={formData.music_title}
                onChange={(e) => setFormData({ ...formData, music_title: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="楽曲名"
              />
            </div>

            {/* 収録CDタイトル */}
            <div>
              <label htmlFor="cd_title" className="block text-sm font-medium text-gray-700">
                収録CDタイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cd_title"
                value={formData.cd_title}
                onChange={(e) => setFormData({ ...formData, cd_title: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="CD/アルバム名"
              />
            </div>

            {/* アーティスト */}
            <div>
              <label htmlFor="artist" className="block text-sm font-medium text-gray-700">
                アーティスト <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="artist"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="アーティスト名"
              />
            </div>

            {/* レコード番号 */}
            <div>
              <label htmlFor="record_number" className="block text-sm font-medium text-gray-700">
                レコード番号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="record_number"
                value={formData.record_number}
                onChange={(e) => setFormData({ ...formData, record_number: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="例：ABCD-12345"
              />
            </div>

            {/* JASRAC作品コード */}
            <div>
              <label htmlFor="jasrac_code" className="block text-sm font-medium text-gray-700">
                JASRAC作品コード <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="jasrac_code"
                value={formData.jasrac_code}
                onChange={(e) => setFormData({ ...formData, jasrac_code: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="例：123-4567-8"
              />
            </div>

            {/* 楽曲種類 */}
            <div>
              <label htmlFor="music_type" className="block text-sm font-medium text-gray-700">
                楽曲種類 <span className="text-red-500">*</span>
              </label>
              <select
                id="music_type"
                value={formData.music_type}
                onChange={(e) => setFormData({ ...formData, music_type: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">選択してください</option>
                <option value="cd">CD楽曲</option>
                <option value="download">データダウンロード楽曲</option>
                <option value="other">その他（オリジナル曲）</option>
              </select>
            </div>
          </div>
        </div>
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
            type="button"
            onClick={(e) => handleSubmit(e as React.FormEvent, 'save')}
            disabled={saving || uploading || !formData.work_title || !formData.work_story || !formData.music_title || !formData.cd_title || !formData.artist || !formData.record_number || !formData.jasrac_code || !formData.music_type || !formData.music_rights_cleared}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
              saving || uploading || !formData.work_title || !formData.work_story || !formData.music_title || !formData.cd_title || !formData.artist || !formData.record_number || !formData.jasrac_code || !formData.music_type || !formData.music_rights_cleared
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {saving && savingMode === 'save' ? '一時保存中...' : '一時保存'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as React.FormEvent, 'submit')}
            disabled={saving || uploading || !formData.work_title || !formData.work_story || !formData.music_title || !formData.cd_title || !formData.artist || !formData.record_number || !formData.jasrac_code || !formData.music_type || !formData.music_rights_cleared || !preliminaryVideo}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
              saving || uploading || !formData.work_title || !formData.work_story || !formData.music_title || !formData.cd_title || !formData.artist || !formData.record_number || !formData.jasrac_code || !formData.music_type || !formData.music_rights_cleared || !preliminaryVideo
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saving && savingMode === 'submit' ? '登録中...' : '完了登録'}
          </button>
        </div>
      </div>
    </form>
  )
}