'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import FileUpload from '@/components/FileUpload'
import FileList from '@/components/FileList'
import type { Entry, EntryFile } from '@/lib/types'

interface AdditionalInfoFormProps {
  entry: Entry
  initialFiles: EntryFile[]
  userId: string
}

export default function AdditionalInfoForm({ entry, initialFiles, userId }: AdditionalInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    sponsor: entry.sponsor || '',
    remarks: entry.remarks || ''
  })
  
  const [saving, setSaving] = useState(false)
  const [fileListRefreshKey, setFileListRefreshKey] = useState(0)

  // ファイル数をカウント
  const fileStats = initialFiles.reduce((acc, file) => {
    if (file.file_type === 'music') acc.music++
    else if (file.file_type === 'video') acc.video++
    else if (file.file_type === 'photo') acc.photo++
    return acc
  }, { music: 0, video: 0, photo: 0 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('entries')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id)

      if (error) throw error

      showToast('追加情報を保存しました', 'success')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving additional info:', error)
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUploaded = () => {
    setFileListRefreshKey(prev => prev + 1)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="sponsor" className="block text-sm font-medium text-gray-700">
          協賛企業・協賛品
        </label>
        <textarea
          id="sponsor"
          value={formData.sponsor}
          onChange={(e) => setFormData({ ...formData, sponsor: e.target.value })}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="協賛企業名や提供品がある場合は記入してください"
        />
      </div>

      <div>
        <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
          備考
        </label>
        <textarea
          id="remarks"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="その他の連絡事項があれば記入してください"
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ファイルアップロード</h3>
        
        {/* 写真アップロード */}
        <div className="mb-6">
          <h4 className="text-base font-medium text-gray-700 mb-2">写真</h4>
          {fileStats.photo === 0 ? (
            <FileUpload
              userId={userId}
              entryId={entry.id}
              fileType="photo"
              onUploadComplete={handleFileUploaded}
            />
          ) : (
            <FileList
              entryId={entry.id}
              fileType="photo"
              editable={true}
              refreshKey={fileListRefreshKey}
              onFileDeleted={handleFileUploaded}
            />
          )}
        </div>

        {/* 動画アップロード */}
        <div className="mb-6">
          <h4 className="text-base font-medium text-gray-700 mb-2">動画 <span className="text-red-500">*</span></h4>
          {fileStats.video === 0 ? (
            <FileUpload
              userId={userId}
              entryId={entry.id}
              fileType="video"
              onUploadComplete={handleFileUploaded}
            />
          ) : (
            <FileList
              entryId={entry.id}
              fileType="video"
              editable={true}
              refreshKey={fileListRefreshKey}
              onFileDeleted={handleFileUploaded}
            />
          )}
        </div>

        {/* 音源アップロード */}
        <div className="mb-6">
          <h4 className="text-base font-medium text-gray-700 mb-2">
            音源 <span className="text-red-500">*</span>
            {entry.use_different_songs && ' (準決勝用・決勝用の2つ)'}
          </h4>
          {fileStats.music < (entry.use_different_songs ? 2 : 1) ? (
            <FileUpload
              userId={userId}
              entryId={entry.id}
              fileType="music"
              onUploadComplete={handleFileUploaded}
            />
          ) : (
            <FileList
              entryId={entry.id}
              fileType="music"
              editable={true}
              refreshKey={fileListRefreshKey}
              showMusicLabels={true}
              useDifferentSongs={entry.use_different_songs}
              onFileDeleted={handleFileUploaded}
            />
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
            saving 
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