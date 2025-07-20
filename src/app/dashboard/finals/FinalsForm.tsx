'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry, EntryFile } from '@/lib/types'

interface FinalsFormProps {
  entry: Entry
  initialFiles: EntryFile[]
  userId: string
}

export default function FinalsForm({ entry, initialFiles, userId }: FinalsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    music_title: entry.music_title || '',
    original_artist: entry.original_artist || '',
    final_music_title: entry.final_music_title || '',
    final_original_artist: entry.final_original_artist || '',
    use_different_songs: entry.use_different_songs || false,
    choreographer: entry.choreographer || '',
    choreographer_furigana: entry.choreographer_furigana || '',
    story: entry.story || ''
  })
  
  const [files, setFiles] = useState<EntryFile[]>(initialFiles)
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
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id)

      if (error) throw error

      showToast('本選情報を保存しました', 'success')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving finals info:', error)
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'music' | 'audio') => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック（100MB）
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      showToast('ファイルサイズが100MBを超えています', 'error')
      return
    }

    // ファイル形式チェック
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac']
    if (!allowedTypes.includes(file.type)) {
      showToast('MP3、WAV、AAC形式のファイルを選択してください', 'error')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // ファイル名をサニタイズ
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileName = `${fileType}_${userId}_${timestamp}_${sanitizedName}`

      // アップロード
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // ファイル情報をデータベースに保存
      const { data: newFile, error: dbError } = await supabase
        .from('entry_files')
        .insert({
          entry_id: entry.id,
          file_type: fileType,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type
        })
        .select()
        .single()

      if (dbError) throw dbError

      setFiles([...files, newFile])
      showToast(`${fileType === 'music' ? '音源' : '音声'}ファイルをアップロードしました`, 'success')
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

  const handleFileDelete = async (fileId: string) => {
    const fileToDelete = files.find(f => f.id === fileId)
    if (!fileToDelete || !window.confirm('このファイルを削除してもよろしいですか？')) return

    setUploading(true)
    try {
      // ストレージから削除
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([fileToDelete.file_path])

      if (storageError) throw storageError

      // データベースから削除
      const { error: dbError } = await supabase
        .from('entry_files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError

      setFiles(files.filter(f => f.id !== fileId))
      showToast('ファイルを削除しました', 'success')
    } catch (error) {
      console.error('Error deleting file:', error)
      showToast('削除に失敗しました', 'error')
    } finally {
      setUploading(false)
    }
  }

  const musicFiles = files.filter(f => f.file_type === 'music')
  const audioFiles = files.filter(f => f.file_type === 'audio')

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          本選情報の登録
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          本選で使用する楽曲情報を入力してください。
        </p>
      </div>

      {/* 楽曲使用設定 */}
      <div className="bg-gray-50 p-4 rounded-md">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.use_different_songs}
            onChange={(e) => setFormData({ ...formData, use_different_songs: e.target.checked })}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">
            準決勝と決勝で異なる楽曲を使用する
          </span>
        </label>
      </div>

      {/* 準決勝用楽曲 */}
      <div className="space-y-4 border-t pt-6">
        <h4 className="font-medium text-gray-900">準決勝用楽曲</h4>
        
        <div>
          <label htmlFor="music_title" className="block text-sm font-medium text-gray-700">
            楽曲タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="music_title"
            value={formData.music_title}
            onChange={(e) => setFormData({ ...formData, music_title: e.target.value })}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="例：Swan Lake"
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
            placeholder="例：Tchaikovsky"
          />
        </div>
      </div>

      {/* 決勝用楽曲（条件付き表示） */}
      {formData.use_different_songs && (
        <div className="space-y-4 border-t pt-6">
          <h4 className="font-medium text-gray-900">決勝用楽曲</h4>
          
          <div>
            <label htmlFor="final_music_title" className="block text-sm font-medium text-gray-700">
              楽曲タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="final_music_title"
              value={formData.final_music_title}
              onChange={(e) => setFormData({ ...formData, final_music_title: e.target.value })}
              required={formData.use_different_songs}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例：Boléro"
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
              placeholder="例：Maurice Ravel"
            />
          </div>
        </div>
      )}

      {/* 振付師情報 */}
      <div className="space-y-4 border-t pt-6">
        <h4 className="font-medium text-gray-900">振付師情報</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="choreographer" className="block text-sm font-medium text-gray-700">
              振付師名
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
            <label htmlFor="choreographer_furigana" className="block text-sm font-medium text-gray-700">
              振付師名（フリガナ）
            </label>
            <input
              type="text"
              id="choreographer_furigana"
              value={formData.choreographer_furigana}
              onChange={(e) => setFormData({ ...formData, choreographer_furigana: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="カタカナで入力"
            />
          </div>
        </div>
      </div>

      {/* ストーリー・コンセプト */}
      <div>
        <label htmlFor="story" className="block text-sm font-medium text-gray-700">
          ストーリー・コンセプト
        </label>
        <textarea
          id="story"
          value={formData.story}
          onChange={(e) => setFormData({ ...formData, story: e.target.value })}
          rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="作品のストーリーやコンセプトを記入してください"
        />
      </div>

      {/* ファイルアップロード */}
      <div className="space-y-6 border-t pt-6">
        <h4 className="font-medium text-gray-900">音源ファイル</h4>
        
        {/* 音源ファイル */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            音源ファイル（音楽）
          </label>
          
          {musicFiles.length > 0 ? (
            <div className="space-y-2">
              {musicFiles.map((file) => (
                <div key={file.id} className="border border-gray-300 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {file.file_size && `${(file.file_size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileDelete(file.id)}
                      disabled={uploading}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/aac"
                onChange={(e) => handleFileUpload(e, 'music')}
                disabled={uploading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                MP3、WAV、AAC形式（最大100MB）
              </p>
            </div>
          )}
        </div>

        {/* 音声ファイル（ナレーションなど） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            音声ファイル（ナレーションなど）
          </label>
          
          {audioFiles.length > 0 ? (
            <div className="space-y-2">
              {audioFiles.map((file) => (
                <div key={file.id} className="border border-gray-300 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {file.file_size && `${(file.file_size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileDelete(file.id)}
                      disabled={uploading}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/aac"
                onChange={(e) => handleFileUpload(e, 'audio')}
                disabled={uploading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/aac"
                onChange={(e) => handleFileUpload(e, 'audio')}
                disabled={uploading}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                MP3、WAV、AAC形式（最大100MB）
              </p>
            </div>
          )}
        </div>
        
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
          disabled={saving || uploading}
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
            saving || uploading
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