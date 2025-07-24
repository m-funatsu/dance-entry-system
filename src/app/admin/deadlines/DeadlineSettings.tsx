'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Setting {
  id: string
  key: string
  value: string | null
  description?: string | null
}

interface DeadlineSettingsProps {
  initialSettings: Setting[]
}

const sectionLabels: Record<string, string> = {
  basic_info_deadline: '基本情報',
  music_info_deadline: '予選情報',
  consent_form_deadline: '参加同意書',
  program_info_deadline: 'プログラム掲載用情報',
  semifinals_deadline: '準決勝情報',
  finals_deadline: '決勝情報',
  sns_deadline: 'SNS情報',
  optional_request_deadline: '任意申請'
}

const sectionDescriptions: Record<string, string> = {
  basic_info_deadline: 'ダンスジャンル、参加者情報、連絡先などの基本情報',
  music_info_deadline: '予選動画、楽曲情報',
  consent_form_deadline: '参加同意書の提出',
  program_info_deadline: 'プログラムに掲載する情報の登録',
  semifinals_deadline: '準決勝用の音響・照明指示書',
  finals_deadline: '決勝用楽曲情報、音響・照明指示書',
  sns_deadline: 'Instagram、Twitter、Facebook情報',
  optional_request_deadline: 'その他の申請事項'
}

export default function DeadlineSettings({ initialSettings }: DeadlineSettingsProps) {
  const router = useRouter()
  const supabase = createClient()
  
  // settingsの配列をオブジェクトに変換
  const settingsMap = initialSettings.reduce((acc, setting) => {
    acc[setting.key] = setting.value || ''
    return acc
  }, {} as Record<string, string>)
  
  const [deadlines, setDeadlines] = useState(settingsMap)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // 設定キーの一覧
  const deadlineKeys = [
    'basic_info_deadline',
    'music_info_deadline',
    'consent_form_deadline',
    'program_info_deadline',
    'semifinals_deadline',
    'finals_deadline',
    'sns_deadline',
    'optional_request_deadline'
  ]

  const handleDeadlineChange = (key: string, value: string) => {
    setDeadlines({
      ...deadlines,
      [key]: value
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      // 各期限設定を更新（upsertを使用）
      for (const key of deadlineKeys) {
        const { error } = await supabase
          .from('settings')
          .upsert({
            key,
            value: deadlines[key] || '',  // nullではなく空文字列を使用
            description: sectionDescriptions[key] || ''
          }, {
            onConflict: 'key'
          })

        if (error) {
          console.error(`Error saving ${key}:`, error)
          throw error
        }
      }

      setMessage('期限設定を保存しました')
      router.refresh()
    } catch (error) {
      console.error('Error saving deadlines:', error)
      setMessage('期限設定の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return ''
    // YYYY-MM-DD形式にフォーマット
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateTimeForDatabase = (dateString: string) => {
    if (!dateString) return ''
    // 日付を受け取って、その日の23:59:59に設定
    const date = new Date(dateString)
    date.setHours(23, 59, 59, 999)
    return date.toISOString()
  }

  return (
    <div className="space-y-6">
      {deadlineKeys.map((key) => (
        <div key={key} className="border-b pb-4">
          <div className="mb-2">
            <h3 className="text-base font-medium text-gray-900">
              {sectionLabels[key]}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {sectionDescriptions[key]}
            </p>
          </div>
          <div>
            <label htmlFor={`deadline-${key}`} className="block text-sm font-medium text-gray-700">
              登録期限
            </label>
            <input
              type="date"
              id={`deadline-${key}`}
              value={formatDateForInput(deadlines[key])}
              onChange={(e) => handleDeadlineChange(key, formatDateTimeForDatabase(e.target.value))}
              className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {!deadlines[key] && (
              <p className="mt-1 text-sm text-gray-500">期限なし</p>
            )}
            {deadlines[key] && (
              <p className="mt-1 text-sm text-gray-500">
                期限: {new Date(deadlines[key]).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      ))}

      {message && (
        <div className={`p-4 rounded-md ${
          message.includes('失敗') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
        }`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

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