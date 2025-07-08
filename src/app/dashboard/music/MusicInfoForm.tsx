'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Entry } from '@/lib/types'
import FileUpload from '@/components/FileUpload'
import FileList from '@/components/FileList'
import BackgroundLoader from '@/components/BackgroundLoader'

interface MusicInfoFormProps {
  userId: string
  entryId: string
  existingEntry?: Entry | null
}

export default function MusicInfoForm({ userId, entryId, existingEntry }: MusicInfoFormProps) {
  const [formData, setFormData] = useState(() => ({
    music_title: existingEntry?.music_title || '',
    choreographer: existingEntry?.choreographer || '',
    story: existingEntry?.story || '',
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [uploadError, setUploadError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (existingEntry) {
      setFormData({
        music_title: existingEntry.music_title || '',
        choreographer: existingEntry.choreographer || '',
        story: existingEntry.story || '',
      })
    }
  }, [existingEntry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('entries')
        .update({
          music_title: formData.music_title,
          choreographer: formData.choreographer,
          story: formData.story,
        })
        .eq('id', entryId)

      if (error) {
        setError('楽曲情報の更新に失敗しました')
        return
      }

      router.push('/dashboard?message=楽曲情報を保存しました')
    } catch {
      setError('楽曲情報の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleUploadComplete = () => {
    setUploadSuccess('ファイルのアップロードが完了しました')
    setUploadError('')
  }

  const handleUploadError = (error: string) => {
    setUploadError(error)
    setUploadSuccess('')
  }

  const handleFileDeleted = () => {
    setUploadSuccess('ファイルを削除しました')
    setUploadError('')
  }

  return (
    <>
      <BackgroundLoader pageType="music" />
      <div className="space-y-8 min-h-screen p-5" style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), var(--music-bg-image, none)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      {/* 楽曲情報フォーム */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg p-6 shadow-lg">
        {/* 曲目 */}
        <div>
          <label htmlFor="music_title" className="block text-sm font-medium text-gray-700">
            曲目 *
          </label>
          <input
            type="text"
            id="music_title"
            name="music_title"
            required
            value={formData.music_title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="使用楽曲のタイトルを入力"
          />
        </div>

        {/* 振付師 */}
        <div>
          <label htmlFor="choreographer" className="block text-sm font-medium text-gray-700">
            振付師 *
          </label>
          <input
            type="text"
            id="choreographer"
            name="choreographer"
            required
            value={formData.choreographer}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="振付師の名前を入力"
          />
        </div>

        {/* ストーリー */}
        <div>
          <label htmlFor="story" className="block text-sm font-medium text-gray-700">
            ストーリー *
          </label>
          <textarea
            id="story"
            name="story"
            required
            rows={6}
            value={formData.story}
            onChange={handleChange}
            maxLength={800}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="パフォーマンスのストーリーやコンセプトを入力（800文字以内）"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.story.length}/800文字
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>

      {/* ファイルアップロードセクション */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-6">ファイル管理</h3>
        
        {uploadSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-green-700 text-sm">{uploadSuccess}</div>
          </div>
        )}

        {uploadError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700 text-sm">{uploadError}</div>
          </div>
        )}

        <div className="space-y-8">
          {/* 動画アップロード */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">動画</h4>
            <p className="text-sm text-gray-600 mb-4">パフォーマンス動画をアップロードしてください（最大50MB）</p>
            <FileUpload
              userId={userId}
              entryId={entryId}
              fileType="video"
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
            <div className="mt-4">
              <FileList
                entryId={entryId}
                fileType="video"
                onFileDeleted={handleFileDeleted}
              />
            </div>
          </div>

          {/* 音源アップロード */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">音源</h4>
            <p className="text-sm text-gray-600 mb-4">本大会で使用する予定の音源をアップロードしてください</p>
            <FileUpload
              userId={userId}
              entryId={entryId}
              fileType="audio"
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
            <div className="mt-4">
              <FileList
                entryId={entryId}
                fileType="audio"
                onFileDeleted={handleFileDeleted}
              />
            </div>
          </div>

          {/* 写真アップロード */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">写真</h4>
            <p className="text-sm text-gray-600 mb-4">ペア写真や過去の競技写真をアップロードしてください</p>
            <FileUpload
              userId={userId}
              entryId={entryId}
              fileType="photo"
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
            <div className="mt-4">
              <FileList
                entryId={entryId}
                fileType="photo"
                onFileDeleted={handleFileDeleted}
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}