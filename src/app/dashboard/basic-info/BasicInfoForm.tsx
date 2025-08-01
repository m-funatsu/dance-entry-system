'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { BasicInfo } from '@/lib/types'

interface BasicInfoFormProps {
  userId: string
  entryId: string | null
  initialData: BasicInfo | null
}

export default function BasicInfoForm({ userId, entryId, initialData }: BasicInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    dance_style: initialData?.dance_style || '',
    representative_name: initialData?.representative_name || '',
    representative_furigana: initialData?.representative_furigana || '',
    representative_email: initialData?.representative_email || '',
    partner_name: initialData?.partner_name || '',
    partner_furigana: initialData?.partner_furigana || '',
    phone_number: initialData?.phone_number || '',
    choreographer: initialData?.choreographer || '',
    choreographer_furigana: initialData?.choreographer_furigana || '',
    agreement_checked: initialData?.agreement_checked || false,
    privacy_policy_checked: initialData?.privacy_policy_checked || false
  })
  
  const [saving, setSaving] = useState(false)
  const [savingMode, setSavingMode] = useState<'save' | 'submit'>('save')

  // 必須項目が全て入力されているかチェック
  const isAllRequiredFieldsValid = () => {
    // ダンススタイルが選択されているか
    if (!formData.dance_style) return false
    
    // 代表者情報
    if (!formData.representative_name || !formData.representative_name.trim()) return false
    if (!formData.representative_furigana || !formData.representative_furigana.trim()) return false
    if (!formData.representative_email || !formData.representative_email.trim()) return false
    if (!formData.phone_number || !formData.phone_number.trim()) return false
    
    // ペアの場合はペア情報も必須
    if (formData.dance_style === 'couple') {
      if (!formData.partner_name || !formData.partner_name.trim()) return false
      if (!formData.partner_furigana || !formData.partner_furigana.trim()) return false
    }
    
    // 同意チェック
    if (!formData.agreement_checked || !formData.privacy_policy_checked) return false
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent, mode: 'save' | 'submit' = 'submit') => {
    e.preventDefault()
    setSaving(true)
    setSavingMode(mode)

    // 完了保存の場合は必須項目をチェック
    if (mode === 'submit') {
      const requiredFields = [
        { field: 'dance_style', name: 'ダンスジャンル' },
        { field: 'representative_name', name: '代表者氏名' },
        { field: 'representative_furigana', name: '代表者フリガナ' },
        { field: 'representative_email', name: '代表者メールアドレス' },
        { field: 'partner_name', name: 'ペア氏名' },
        { field: 'partner_furigana', name: 'ペアフリガナ' },
        { field: 'phone_number', name: '代表者電話番号' }
      ]

      const missingFields: string[] = []
      for (const { field, name } of requiredFields) {
        const value = formData[field as keyof typeof formData]
        if (typeof value === 'string' && (!value || value.trim() === '')) {
          missingFields.push(name)
        }
      }

      if (!formData.agreement_checked) {
        missingFields.push('参加資格・要件への同意')
      }
      if (!formData.privacy_policy_checked) {
        missingFields.push('プライバシーポリシーへの同意')
      }

      if (missingFields.length > 0) {
        showToast(`以下の必須項目が入力されていません: ${missingFields.join('、')}`, 'error')
        setSaving(false)
        return
      }
    }

    try {
      let currentEntryId = entryId

      // エントリーが存在しない場合は作成
      if (!currentEntryId) {
        const { data: newEntry, error: entryError } = await supabase
          .from('entries')
          .insert({
            user_id: userId,
            participant_names: `${formData.representative_name || '未入力'}\n${formData.partner_name || '未入力'}`,
            status: 'pending'
          })
          .select()
          .maybeSingle()

        if (entryError) throw entryError
        currentEntryId = newEntry.id
      } else {
        // participant_namesを更新
        const { error: updateError } = await supabase
          .from('entries')
          .update({
            participant_names: `${formData.representative_name || '未入力'}\n${formData.partner_name || '未入力'}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentEntryId)

        if (updateError) throw updateError
      }

      const dataToSave = {
        entry_id: currentEntryId,
        dance_style: formData.dance_style,
        representative_name: formData.representative_name,
        representative_furigana: formData.representative_furigana,
        representative_email: formData.representative_email,
        partner_name: formData.partner_name,
        partner_furigana: formData.partner_furigana,
        phone_number: formData.phone_number,
        choreographer: formData.choreographer,
        choreographer_furigana: formData.choreographer_furigana,
        agreement_checked: formData.agreement_checked,
        privacy_policy_checked: formData.privacy_policy_checked
      }

      if (initialData) {
        // 更新
        const { error } = await supabase
          .from('basic_info')
          .update(dataToSave)
          .eq('id', initialData.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('basic_info')
          .insert(dataToSave)

        if (error) throw error
      }

      showToast(
        mode === 'submit' 
          ? '基本情報を保存しました' 
          : '基本情報を一時保存しました', 
        'success'
      )
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving basic info:', error)
      const errorMessage = error instanceof Error ? error.message : '基本情報の保存に失敗しました'
      showToast(errorMessage, 'error')
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


      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">参加者情報</h3>
        
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="representative_email" className="block text-sm font-medium text-gray-700">
            代表者メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="representative_email"
            value={formData.representative_email}
            onChange={(e) => setFormData({ ...formData, representative_email: e.target.value })}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="example@email.com"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="choreographer" className="block text-sm font-medium text-gray-700">
            振付師氏名
          </label>
          <input
            type="text"
            id="choreographer"
            value={formData.choreographer}
            onChange={(e) => setFormData({ ...formData, choreographer: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="振付師の氏名"
          />
        </div>
        <div>
          <label htmlFor="choreographer_furigana" className="block text-sm font-medium text-gray-700">
            振付師フリガナ
          </label>
          <input
            type="text"
            id="choreographer_furigana"
            value={formData.choreographer_furigana}
            onChange={(e) => setFormData({ ...formData, choreographer_furigana: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="カタカナで入力"
          />
        </div>
      </div>

      <div className="space-y-4">
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

        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-2">プライバシーポリシー</h3>
          <div className="text-sm text-gray-600 mb-3">
            <p>
              <a 
                href="https://www.valquacup.jp/policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline"
              >
                プライバシーポリシー
              </a>
            </p>
            <p className="mt-1">※上記よりご確認ください。</p>
          </div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.privacy_policy_checked}
              onChange={(e) => setFormData({ ...formData, privacy_policy_checked: e.target.checked })}
              required
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              プライバシーポリシーに同意する <span className="text-red-500">*</span>
            </span>
          </label>
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
            className={`px-6 py-2 rounded-md text-sm font-medium text-white ${
              saving
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {saving && savingMode === 'save' ? '一時保存中...' : '一時保存'}
          </button>
          <button
            type="submit"
            disabled={saving || !isAllRequiredFieldsValid()}
            className={`px-6 py-2 rounded-md text-sm font-medium text-white ${
              saving || !isAllRequiredFieldsValid()
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving && savingMode === 'submit' ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </form>
  )
}