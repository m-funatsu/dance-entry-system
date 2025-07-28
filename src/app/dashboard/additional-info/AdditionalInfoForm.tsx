'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry, EntryFile } from '@/lib/types'

interface AdditionalInfoFormProps {
  entry: Entry
  initialFiles: EntryFile[]
  userId: string
}

export default function AdditionalInfoForm({ entry }: AdditionalInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    sponsor: entry.sponsor || '',
    remarks: entry.remarks || '',
    // 音響指示書
    sound_semifinal: entry.sound_semifinal || '',
    sound_final: entry.sound_final || '',
    // 照明指示書
    lighting_semifinal: entry.lighting_semifinal || '',
    lighting_final: entry.lighting_final || ''
  })
  
  const [saving, setSaving] = useState(false)
  const [savingMode, setSavingMode] = useState<'save' | 'submit'>('save')

  const handleSubmit = async (e: React.FormEvent, mode: 'save' | 'submit' = 'submit') => {
    e.preventDefault()
    setSaving(true)
    setSavingMode(mode)

    try {
      const { error } = await supabase
        .from('entries')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id)

      if (error) throw error

      showToast(
        mode === 'submit' 
          ? '追加情報を保存しました' 
          : '追加情報を一時保存しました', 
        'success'
      )
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving additional info:', error)
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
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

      {/* 音響指示書セクション */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">音響指示書</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="sound_semifinal" className="block text-sm font-medium text-gray-700">
              準決勝
            </label>
            <textarea
              id="sound_semifinal"
              value={formData.sound_semifinal}
              onChange={(e) => setFormData({ ...formData, sound_semifinal: e.target.value })}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="準決勝での音響に関する指示を記入してください"
            />
          </div>
          <div>
            <label htmlFor="sound_final" className="block text-sm font-medium text-gray-700">
              決勝
            </label>
            <textarea
              id="sound_final"
              value={formData.sound_final}
              onChange={(e) => setFormData({ ...formData, sound_final: e.target.value })}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="決勝での音響に関する指示を記入してください"
            />
          </div>
        </div>
      </div>

      {/* 照明指示書セクション */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">照明指示書</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="lighting_semifinal" className="block text-sm font-medium text-gray-700">
              準決勝
            </label>
            <textarea
              id="lighting_semifinal"
              value={formData.lighting_semifinal}
              onChange={(e) => setFormData({ ...formData, lighting_semifinal: e.target.value })}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="準決勝での照明に関する指示を記入してください"
            />
          </div>
          <div>
            <label htmlFor="lighting_final" className="block text-sm font-medium text-gray-700">
              決勝
            </label>
            <textarea
              id="lighting_final"
              value={formData.lighting_final}
              onChange={(e) => setFormData({ ...formData, lighting_final: e.target.value })}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="決勝での照明に関する指示を記入してください"
            />
          </div>
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
        <div className="space-x-3">
          <button
            type="button"
            onClick={(e) => handleSubmit(e as React.FormEvent, 'save')}
            disabled={saving}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
              saving
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {saving && savingMode === 'save' ? '一時保存中...' : '一時保存'}
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
            {saving && savingMode === 'submit' ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </form>
  )
}