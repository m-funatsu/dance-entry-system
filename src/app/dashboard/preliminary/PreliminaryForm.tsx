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
  
  const [formData, setFormData] = useState({
    work_title: initialData?.work_title || '',
    work_story: initialData?.work_story || '',
    music_rights_cleared: initialData?.music_rights_cleared || false,
    music_title: initialData?.music_title || '',
    cd_title: initialData?.cd_title || '',
    artist: initialData?.artist || '',
    record_number: initialData?.record_number || '',
    jasrac_code: initialData?.jasrac_code || '',
    music_type: initialData?.music_type || 'original'
  })
  
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!entryId) {
      showToast('基本情報を先に保存してください', 'error')
      router.push('/dashboard/basic-info')
      return
    }

    setSaving(true)

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

      showToast('予選情報を保存しました', 'success')
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
              作品キャラクター・ストーリー等（50字以内）
            </label>
            <textarea
              id="work_story"
              value={formData.work_story}
              onChange={(e) => setFormData({ ...formData, work_story: e.target.value })}
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
          <h4 className="text-base font-medium text-gray-900 mb-4">予選提出動画</h4>
          
          {preliminaryVideo ? (
            <div className="border border-gray-300 rounded-md p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="h-10 w-10 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{preliminaryVideo.file_name}</p>
                    <p className="text-sm text-gray-500">
                      {preliminaryVideo.file_size && `${(preliminaryVideo.file_size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFileDelete}
                  disabled={uploading}
                  className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                >
                  削除
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/avi,video/mov"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                MP4、MOV、AVI形式（最大200MB）
              </p>
            </div>
          )}
          
          {uploading && (
            <div className="mt-3">
              <div className="bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                アップロード中... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        {/* 楽曲著作権情報セクション */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h4 className="text-base font-medium text-gray-900">楽曲著作権情報</h4>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.music_rights_cleared}
                onChange={(e) => setFormData({ ...formData, music_rights_cleared: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                楽曲著作権許諾済み
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label htmlFor="cd_title" className="block text-sm font-medium text-gray-700">
                収録CDタイトル
              </label>
              <input
                type="text"
                id="cd_title"
                value={formData.cd_title}
                onChange={(e) => setFormData({ ...formData, cd_title: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="CD/アルバム名"
              />
            </div>

            <div>
              <label htmlFor="record_number" className="block text-sm font-medium text-gray-700">
                レコード番号
              </label>
              <input
                type="text"
                id="record_number"
                value={formData.record_number}
                onChange={(e) => setFormData({ ...formData, record_number: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="例：ABCD-12345"
              />
            </div>

            <div>
              <label htmlFor="jasrac_code" className="block text-sm font-medium text-gray-700">
                JASRAC作品コード
              </label>
              <input
                type="text"
                id="jasrac_code"
                value={formData.jasrac_code}
                onChange={(e) => setFormData({ ...formData, jasrac_code: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="例：123-4567-8"
              />
            </div>

            <div>
              <label htmlFor="music_type" className="block text-sm font-medium text-gray-700">
                楽曲種類
              </label>
              <select
                id="music_type"
                value={formData.music_type}
                onChange={(e) => setFormData({ ...formData, music_type: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="original">オリジナル楽曲</option>
                <option value="existing">既存楽曲</option>
                <option value="remix">リミックス</option>
                <option value="medley">メドレー</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving || uploading || !formData.work_title || !formData.music_title || !formData.artist}
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
            saving || uploading || !formData.work_title || !formData.music_title || !formData.artist
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}