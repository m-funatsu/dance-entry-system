'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry } from '@/lib/types'

interface BasicInfoFormProps {
  userId: string
  initialData: Entry | null
}

export default function BasicInfoForm({ userId, initialData }: BasicInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    dance_style: initialData?.dance_style || '',
    team_name: initialData?.team_name || '',
    participant_names: initialData?.participant_names || '',
    phone_number: initialData?.phone_number || '',
    emergency_contact: initialData?.emergency_contact || '',
    use_different_songs: initialData?.use_different_songs || false
  })
  
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (initialData) {
        // 更新
        const { error } = await supabase
          .from('entries')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('entries')
          .insert({
            user_id: userId,
            ...formData,
            status: 'pending'
          })

        if (error) throw error
      }

      showToast('基本情報を保存しました', 'success')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving basic info:', error)
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="dance_style" className="block text-sm font-medium text-gray-700">
          ダンスジャンル <span className="text-red-500">*</span>
        </label>
        <select
          id="dance_style"
          value={formData.dance_style}
          onChange={(e) => setFormData({ ...formData, dance_style: e.target.value })}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">選択してください</option>
          <option value="Couple Dance">Couple Dance</option>
          <option value="Formation">Formation</option>
          <option value="Team">Team</option>
        </select>
      </div>

      <div>
        <label htmlFor="team_name" className="block text-sm font-medium text-gray-700">
          チーム名／ペア名
        </label>
        <input
          type="text"
          id="team_name"
          value={formData.team_name}
          onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="participant_names" className="block text-sm font-medium text-gray-700">
          参加者名 <span className="text-red-500">*</span>
        </label>
        <textarea
          id="participant_names"
          value={formData.participant_names}
          onChange={(e) => setFormData({ ...formData, participant_names: e.target.value })}
          required
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="複数名の場合は改行で区切ってください"
        />
      </div>

      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
          代表者電話番号 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone_number"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="090-1234-5678"
        />
      </div>

      <div>
        <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">
          緊急連絡先 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="emergency_contact"
          value={formData.emergency_contact}
          onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="090-1234-5678"
        />
      </div>

      <div>
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