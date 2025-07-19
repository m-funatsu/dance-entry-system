'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry } from '@/lib/types'

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
    story: entry.story || ''
  })
  
  const [saving, setSaving] = useState(false)

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

      {entry.use_different_songs && (
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
                required={entry.use_different_songs}
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
                required={entry.use_different_songs}
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