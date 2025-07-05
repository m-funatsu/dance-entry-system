'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Entry } from '@/lib/types'

interface EntryFormProps {
  userId: string
  existingEntry?: Entry | null
}

export default function EntryForm({ userId, existingEntry }: EntryFormProps) {
  const [formData, setFormData] = useState(() => ({
    dance_style: existingEntry?.dance_style || '',
    team_name: existingEntry?.team_name || '',
    participant_names: existingEntry?.participant_names || '',
    phone_number: existingEntry?.phone_number || '',
    emergency_contact: existingEntry?.emergency_contact || '',
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // 既存エントリーがある場合、フォームデータを設定
  useEffect(() => {
    console.log('ExistingEntry:', existingEntry)
    if (existingEntry) {
      console.log('Setting form data with existing entry')
      setFormData({
        dance_style: existingEntry.dance_style || '',
        team_name: existingEntry.team_name || '',
        participant_names: existingEntry.participant_names || '',
        phone_number: existingEntry.phone_number || '',
        emergency_contact: existingEntry.emergency_contact || '',
      })
    }
  }, [existingEntry])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      if (existingEntry) {
        const { error } = await supabase
          .from('entries')
          .update({
            dance_style: formData.dance_style,
            team_name: formData.team_name,
            participant_names: formData.participant_names,
            phone_number: formData.phone_number,
            emergency_contact: formData.emergency_contact,
          })
          .eq('id', existingEntry.id)

        if (error) {
          setError('エントリー情報の更新に失敗しました')
          return
        }
      } else {
        // 既存エントリーがないことを再確認してから作成
        const { data: checkEntries } = await supabase
          .from('entries')
          .select('id')
          .eq('user_id', userId)
          .limit(1)

        if (checkEntries && checkEntries.length > 0) {
          setError('既にエントリーが存在します。ページを再読み込みしてください。')
          return
        }

        const { error } = await supabase
          .from('entries')
          .insert([
            {
              user_id: userId,
              dance_style: formData.dance_style,
              team_name: formData.team_name,
              participant_names: formData.participant_names,
              phone_number: formData.phone_number,
              emergency_contact: formData.emergency_contact,
              status: 'pending',
            }
          ])

        if (error) {
          setError('エントリー情報の登録に失敗しました')
          return
        }
      }

      router.push('/dashboard?message=エントリー情報を保存しました')
    } catch {
      setError('エントリー情報の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div>
      {/* デバッグ情報 */}
      <div className="mb-4 p-4 bg-gray-100 rounded text-sm">
        <strong>デバッグ情報:</strong><br/>
        ExistingEntry: {existingEntry ? 'あり' : 'なし'}<br/>
        FormData: {JSON.stringify(formData, null, 2)}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="dance_style" className="block text-sm font-medium text-gray-700">
            ダンスジャンル *
          </label>
          <select
            id="dance_style"
            name="dance_style"
            required
            value={formData.dance_style}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">選択してください</option>
            <option value="hip-hop">Hip-Hop</option>
            <option value="jazz">Jazz</option>
            <option value="contemporary">Contemporary</option>
            <option value="ballet">Ballet</option>
            <option value="street">Street</option>
            <option value="breakdance">Breakdance</option>
            <option value="k-pop">K-Pop</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div>
          <label htmlFor="team_name" className="block text-sm font-medium text-gray-700">
            チーム名（個人の場合は空欄）
          </label>
          <input
            type="text"
            id="team_name"
            name="team_name"
            value={formData.team_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="チーム名を入力"
          />
        </div>
      </div>

      <div>
        <label htmlFor="participant_names" className="block text-sm font-medium text-gray-700">
          参加者名 *
        </label>
        <textarea
          id="participant_names"
          name="participant_names"
          required
          rows={3}
          value={formData.participant_names}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="参加者の氏名を入力（複数人の場合は改行で区切る）"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
            電話番号
          </label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="090-1234-5678"
          />
        </div>

        <div>
          <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700">
            緊急連絡先
          </label>
          <input
            type="text"
            id="emergency_contact"
            name="emergency_contact"
            value={formData.emergency_contact}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="緊急時の連絡先（氏名・電話番号）"
          />
        </div>
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
    </div>
  )
}