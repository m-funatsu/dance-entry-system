'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry } from '@/lib/types'

interface OptionalRequestFormProps {
  entry: Entry
}

export default function OptionalRequestForm({ entry }: OptionalRequestFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    optional_requests: entry.optional_requests || ''
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

      showToast('任意申請を保存しました', 'success')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving optional request:', error)
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          特別な要望や申請事項がある場合は、以下に記入してください。
        </p>
        
        <label htmlFor="optional_requests" className="block text-sm font-medium text-gray-700">
          申請内容
        </label>
        <textarea
          id="optional_requests"
          value={formData.optional_requests}
          onChange={(e) => setFormData({ ...formData, optional_requests: e.target.value })}
          rows={8}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="例：&#10;・車椅子での参加のため、バリアフリー対応をお願いします&#10;・舞台装置の使用を希望します&#10;・特殊な照明演出を予定しています"
        />
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              申請内容は運営側で審査させていただきます。
              すべての要望にお応えできない場合がありますので、あらかじめご了承ください。
            </p>
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