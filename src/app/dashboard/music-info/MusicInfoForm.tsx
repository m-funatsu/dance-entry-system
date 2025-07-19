'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry, EntryFile } from '@/lib/types'
import FileUpload from '@/components/FileUpload'

interface MusicInfoFormProps {
  entry: Entry
}

export default function MusicInfoForm({ entry }: MusicInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    music_title: entry.music_title || '',
    original_artist: entry.original_artist || '',
    final_music_title: entry.final_music_title || '',
    final_original_artist: entry.final_original_artist || '',
    choreographer: entry.choreographer || '',
    story: entry.story || '',
    use_different_songs: entry.use_different_songs || false
  })
  
  const [saving, setSaving] = useState(false)
  const [existingFiles, setExistingFiles] = useState<EntryFile[]>([])
  const [user, setUser] = useState<{id: string} | null>(null)

  const fetchUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }, [supabase.auth])

  const fetchExistingFiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('entry_files')
        .select('*')
        .eq('entry_id', entry.id)
        .in('file_type', ['music', 'video'])

      if (error) throw error
      setExistingFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }, [entry.id, supabase])

  useEffect(() => {
    fetchExistingFiles()
    fetchUser()
  }, [fetchExistingFiles, fetchUser])


  const handleDeleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('entry_files')
        .delete()
        .eq('id', fileId)

      if (error) throw error

      showToast('ファイルを削除しました', 'success')
      fetchExistingFiles()
    } catch (error) {
      console.error('Error deleting file:', error)
      showToast('ファイルの削除に失敗しました', 'error')
    }
  }

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

      showToast('楽曲情報を保存しました', 'success')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving music info:', error)
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">準決勝用楽曲</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="music_title" className="block text-sm font-medium text-gray-700">
              曲名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="music_title"
              value={formData.music_title}
              onChange={(e) => setFormData({ ...formData, music_title: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="original_artist" className="block text-sm font-medium text-gray-700">
              原曲アーティスト <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="original_artist"
              value={formData.original_artist}
              onChange={(e) => setFormData({ ...formData, original_artist: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {formData.use_different_songs && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">決勝用楽曲</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="final_music_title" className="block text-sm font-medium text-gray-700">
                曲名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="final_music_title"
                value={formData.final_music_title}
                onChange={(e) => setFormData({ ...formData, final_music_title: e.target.value })}
                required={formData.use_different_songs}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="final_original_artist" className="block text-sm font-medium text-gray-700">
                原曲アーティスト <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="final_original_artist"
                value={formData.final_original_artist}
                onChange={(e) => setFormData({ ...formData, final_original_artist: e.target.value })}
                required={formData.use_different_songs}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="choreographer" className="block text-sm font-medium text-gray-700">
          振付師
        </label>
        <input
          type="text"
          id="choreographer"
          value={formData.choreographer}
          onChange={(e) => setFormData({ ...formData, choreographer: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="story" className="block text-sm font-medium text-gray-700">
          ストーリー・コンセプト
        </label>
        <textarea
          id="story"
          value={formData.story}
          onChange={(e) => setFormData({ ...formData, story: e.target.value })}
          rows={5}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="作品のストーリーやコンセプトを記入してください"
        />
      </div>

      {/* 予選動画セクション */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">予選動画</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-4">
            予選用の動画をアップロードしてください（MP4、MOV、AVI形式）
          </p>
          {user && (
            <FileUpload
              userId={user.id}
              entryId={entry.id}
              fileType="video"
              onUploadComplete={() => fetchExistingFiles()}
            />
          )}
          {existingFiles.filter(f => f.file_type === 'video').map((file) => (
            <div key={file.id} className="mt-4 p-3 border rounded-md bg-white">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">予選動画: {file.file_name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteFile(file.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 音源アップロードセクション */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">音源ファイル</h3>
        
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.use_different_songs}
              onChange={(e) => setFormData({ ...formData, use_different_songs: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              準決勝・決勝で異なる楽曲を使用する
            </span>
          </label>
        </div>
        
        {/* 準決勝用音源 */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 mb-3">
            {formData.use_different_songs ? '準決勝用音源' : '準決勝・決勝共通音源'}
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            {user && (
              <FileUpload
                userId={user.id}
                entryId={entry.id}
                fileType="music"
                onUploadComplete={() => fetchExistingFiles()}
              />
            )}
            {existingFiles.filter(f => f.file_type === 'music' && f.purpose !== '決勝').map((file) => (
              <div key={file.id} className="mt-4 p-3 border rounded-md bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {formData.use_different_songs ? '準決勝用' : '準決勝・決勝共通'}: {file.file_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteFile(file.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 決勝用音源（異なる楽曲使用時のみ） */}
        {formData.use_different_songs && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">決勝用音源</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              {user && (
                <FileUpload
                  userId={user.id}
                  entryId={entry.id}
                  fileType="music"
                  onUploadComplete={() => fetchExistingFiles()}
                />
              )}
              {existingFiles.filter(f => f.file_type === 'music' && f.purpose === '決勝').map((file) => (
                <div key={file.id} className="mt-4 p-3 border rounded-md bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">決勝用: {file.file_name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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