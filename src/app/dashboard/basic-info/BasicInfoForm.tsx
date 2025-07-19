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
    representative_name: initialData?.representative_name || '',
    representative_furigana: initialData?.representative_furigana || '',
    partner_name: initialData?.partner_name || '',
    partner_furigana: initialData?.partner_furigana || '',
    phone_number: initialData?.phone_number || '',
    emergency_contact: initialData?.emergency_contact || '',
    agreement_checked: initialData?.agreement_checked || false
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
            participant_names: `${formData.representative_name}\n${formData.partner_name}`,
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
            participant_names: `${formData.representative_name}\n${formData.partner_name}`,
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
          <option value="社交ダンス">社交ダンス</option>
          <option value="バレエ・コンテンポラリーダンス">バレエ・コンテンポラリーダンス</option>
          <option value="ジャズダンス">ジャズダンス</option>
          <option value="ストリートダンス全般">ストリートダンス全般</option>
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

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">参加者情報（ペア）</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="representative_name" className="block text-sm font-medium text-gray-700">
              代表者氏名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="representative_name"
              value={formData.representative_name}
              onChange={(e) => setFormData({ ...formData, representative_name: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="representative_furigana" className="block text-sm font-medium text-gray-700">
              代表者フリガナ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="representative_furigana"
              value={formData.representative_furigana}
              onChange={(e) => setFormData({ ...formData, representative_furigana: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="カタカナで入力"
            />
          </div>
          <div>
            <label htmlFor="partner_name" className="block text-sm font-medium text-gray-700">
              ペア氏名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="partner_name"
              value={formData.partner_name}
              onChange={(e) => setFormData({ ...formData, partner_name: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="partner_furigana" className="block text-sm font-medium text-gray-700">
              ペアフリガナ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="partner_furigana"
              value={formData.partner_furigana}
              onChange={(e) => setFormData({ ...formData, partner_furigana: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="カタカナで入力"
            />
          </div>
        </div>
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

      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">参加資格・エントリー要件</h3>
        <div className="text-sm text-gray-600 space-y-1 mb-3">
          <p className="font-medium mb-2">■ 参加資格</p>
          <ul className="space-y-1 ml-4">
            <li>・ペアであれば、プロ、アマを問わず全ての選手がエントリー可能</li>
            <li>・ダンスによる教師、デモンストレーション等で収入を少額でも得ている場合はプロとみなす</li>
            <li>・プロとアマチュアの混合での出場は不可</li>
            <li>・ペアにおける性別は問わない</li>
            <li>・ペアの年齢合計は 20 歳以上 90 歳未満とする</li>
          </ul>
          <p className="font-medium mt-3 mb-2">■ その他の要件</p>
          <ul className="space-y-1 ml-4">
            <li>・参加規約を確認し、同意します</li>
            <li>・提出した情報に虚偽がないことを確認します</li>
            <li>・著作権に関する規定を遵守します</li>
          </ul>
        </div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.agreement_checked}
            onChange={(e) => setFormData({ ...formData, agreement_checked: e.target.checked })}
            required
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm font-medium text-gray-700">
            上記の参加資格・要件を確認し、同意します <span className="text-red-500">*</span>
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