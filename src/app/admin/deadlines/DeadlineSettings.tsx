'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'

interface Deadline {
  id: string
  section_name: string
  deadline: string | null
  is_required: boolean
}

interface DeadlineSettingsProps {
  initialDeadlines: Deadline[]
}

const sectionLabels: Record<string, string> = {
  basic_info: '基本情報',
  music_info: '楽曲情報',
  additional_info: '追加情報',
  optional_request: '任意申請'
}

export default function DeadlineSettings({ initialDeadlines }: DeadlineSettingsProps) {
  const [deadlines, setDeadlines] = useState(initialDeadlines)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()
  const supabase = createClient()

  const handleDeadlineChange = (sectionName: string, value: string) => {
    setDeadlines(deadlines.map(d => 
      d.section_name === sectionName 
        ? { ...d, deadline: value || null }
        : d
    ))
  }

  const handleRequiredChange = (sectionName: string, value: boolean) => {
    setDeadlines(deadlines.map(d => 
      d.section_name === sectionName 
        ? { ...d, is_required: value }
        : d
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      for (const deadline of deadlines) {
        const { error } = await supabase
          .from('section_deadlines')
          .update({
            deadline: deadline.deadline,
            is_required: deadline.is_required,
            updated_at: new Date().toISOString()
          })
          .eq('id', deadline.id)

        if (error) {
          throw error
        }
      }

      showToast('期限設定を保存しました', 'success')
    } catch (error) {
      console.error('Error saving deadlines:', error)
      showToast('期限設定の保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      {deadlines.map((deadline) => (
        <div key={deadline.id} className="border-b pb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-medium text-gray-900">
              {sectionLabels[deadline.section_name] || deadline.section_name}
            </h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`required-${deadline.section_name}`}
                checked={deadline.is_required}
                onChange={(e) => handleRequiredChange(deadline.section_name, e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor={`required-${deadline.section_name}`} className="ml-2 text-sm text-gray-700">
                必須
              </label>
            </div>
          </div>
          <div>
            <label htmlFor={`deadline-${deadline.section_name}`} className="block text-sm font-medium text-gray-700">
              登録期限
            </label>
            <input
              type="date"
              id={`deadline-${deadline.section_name}`}
              value={formatDateForInput(deadline.deadline)}
              onChange={(e) => handleDeadlineChange(deadline.section_name, e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {!deadline.deadline && (
              <p className="mt-1 text-sm text-gray-500">期限なし</p>
            )}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
            saving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}