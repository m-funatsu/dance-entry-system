'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry, EntryFile } from '@/lib/types'

interface PreliminaryFormProps {
  entry: Entry
  preliminaryVideo: EntryFile | null
  userId: string
}

export default function PreliminaryForm({ entry, preliminaryVideo, userId }: PreliminaryFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    work_title: entry.work_title || ''
  })
  
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('entries')
        .update({
          work_title: formData.work_title,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id)

      if (error) throw error

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
          entry_id: entry.id,
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
          予選で使用する作品タイトルまたはテーマと、予選動画をアップロードしてください。
        </p>
      </div>

      <div>
        <label htmlFor="work_title" className="block text-sm font-medium text-gray-700">
          作品タイトル／テーマ <span className="text-red-500">*</span>
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
        <p className="mt-1 text-sm text-gray-500">
          予選で披露する作品のタイトルまたはテーマを入力してください
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          予選動画
        </label>
        
        {preliminaryVideo ? (
          <div className="border border-gray-300 rounded-md p-4">
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
          disabled={saving || uploading || !formData.work_title}
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
            saving || uploading || !formData.work_title
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