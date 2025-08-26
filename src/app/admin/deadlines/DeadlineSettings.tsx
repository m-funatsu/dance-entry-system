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
  optional_request_deadline: '各種申請',
  // 入力開始日
  advanced_start_date: '準決勝・決勝・SNS・参加同意書・各種申請の入力開始日'
}

const sectionDescriptions: Record<string, string> = {
  basic_info_deadline: 'ダンスジャンル、参加者情報、連絡先などの基本情報',
  music_info_deadline: '予選動画、楽曲情報',
  consent_form_deadline: '参加同意書の提出',
  program_info_deadline: 'プログラムに掲載する情報の登録',
  semifinals_deadline: '準決勝用の音響・照明指示書',
  finals_deadline: '決勝用楽曲情報、音響・照明指示書',
  sns_deadline: 'Instagram、Twitter、Facebook情報',
  optional_request_deadline: '関係者チケット、同伴申請、楽曲使用許諾申請などの各種申請',
  advanced_start_date: '準決勝、決勝、SNS、参加同意書、各種申請フォームの入力が可能になる日'
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

  // 設定キーの一覧（順番を調整）
  const deadlineKeys = [
    'basic_info_deadline',
    'music_info_deadline',
    'program_info_deadline',
    'advanced_start_date', // 入力開始日
    'consent_form_deadline',
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
      // 各期日設定を更新（upsertを使用）
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

      setMessage('期日設定を保存しました')
      router.refresh()
    } catch (error) {
      console.error('Error saving deadlines:', error)
      setMessage('期日設定の保存に失敗しました')
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

  const formatDateTimeForDatabase = (dateString: string, isStartDate: boolean = false) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isStartDate) {
      // 開始日の場合は00:00:00に設定
      date.setHours(0, 0, 0, 0)
    } else {
      // 締切日の場合は23:59:59に設定
      date.setHours(23, 59, 59, 999)
    }
    return date.toISOString()
  }

  return (
    <div className="space-y-6">
      {/* 入力開始日セクション */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-900 mb-3">📅 入力開始日</h3>
        <p className="text-sm text-green-800 mb-4">各セクションがいつから入力可能になるかを設定します。</p>
        
        <div className="bg-white rounded p-4">
          <div className="mb-2">
            <h4 className="text-base font-medium text-gray-900">
              {sectionLabels['advanced_start_date']}
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              {sectionDescriptions['advanced_start_date']}
            </p>
          </div>
          <div>
            <label htmlFor="deadline-advanced_start_date" className="block text-sm font-medium text-gray-700">
              📅 入力開始日
            </label>
            <input
              type="date"
              id="deadline-advanced_start_date"
              value={formatDateForInput(deadlines['advanced_start_date'])}
              onChange={(e) => handleDeadlineChange('advanced_start_date', formatDateTimeForDatabase(e.target.value, true))}
              className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {!deadlines['advanced_start_date'] && (
              <p className="mt-1 text-sm text-gray-500">入力開始日未設定（常に入力可能）</p>
            )}
            {deadlines['advanced_start_date'] && (
              <p className="mt-1 text-sm text-gray-500">
                開始日: {new Date(deadlines['advanced_start_date']).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric'
                })} 00:00
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 入力締切日セクション */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">⏰ 入力締切日</h3>
        <p className="text-sm text-blue-800 mb-4">各セクションの入力締切日を設定します。</p>
        
        <div className="space-y-4">
          {['basic_info_deadline', 'music_info_deadline', 'program_info_deadline', 'consent_form_deadline', 'semifinals_deadline', 'finals_deadline', 'sns_deadline', 'optional_request_deadline'].map((key) => (
            <div key={key} className="bg-white rounded p-4">
              <div className="mb-2">
                <h4 className="text-base font-medium text-gray-900">
                  {sectionLabels[key]}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {sectionDescriptions[key]}
                </p>
              </div>
              <div>
                <label htmlFor={`deadline-${key}`} className="block text-sm font-medium text-gray-700">
                  ⏰ 入力締め切り日
                </label>
                <input
                  type="date"
                  id={`deadline-${key}`}
                  value={formatDateForInput(deadlines[key])}
                  onChange={(e) => handleDeadlineChange(key, formatDateTimeForDatabase(e.target.value))}
                  className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {!deadlines[key] && (
                  <p className="mt-1 text-sm text-gray-500">締切なし</p>
                )}
                {deadlines[key] && (
                  <p className="mt-1 text-sm text-gray-500">
                    締切: {new Date(deadlines[key]).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric'
                    })} 23:59
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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