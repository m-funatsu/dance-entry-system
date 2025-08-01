'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { FormField, TemporarySaveButton, SaveButton, CancelButton, Alert } from '@/components/ui'
import { useFormSave, useFormValidation } from '@/hooks'
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

  // バリデーションルール
  const validationRules = {
    dance_style: { required: true },
    representative_name: { required: true },
    representative_furigana: { 
      required: true,
      pattern: /^[\u30A0-\u30FF\s]+$/,
      custom: (value: unknown) => {
        if (!value) return true
        const strValue = String(value)
        if (!/^[\u30A0-\u30FF\s]+$/.test(strValue)) {
          return 'カタカナで入力してください'
        }
        return true
      }
    },
    representative_email: { 
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      custom: (value: unknown) => {
        if (!value) return true
        const strValue = String(value)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
          return '正しいメールアドレスを入力してください'
        }
        return true
      }
    },
    partner_name: { 
      required: formData.dance_style === 'couple',
      custom: (value: unknown) => {
        const strValue = String(value || '')
        if (formData.dance_style === 'couple' && !strValue) {
          return 'ペアの場合は必須です'
        }
        return true
      }
    },
    partner_furigana: { 
      required: formData.dance_style === 'couple',
      pattern: /^[\u30A0-\u30FF\s]+$/,
      custom: (value: unknown) => {
        const strValue = String(value || '')
        if (formData.dance_style === 'couple') {
          if (!strValue) return 'ペアの場合は必須です'
          if (!/^[\u30A0-\u30FF\s]+$/.test(strValue)) {
            return 'カタカナで入力してください'
          }
        }
        return true
      }
    },
    phone_number: { 
      required: true,
      pattern: /^[\d-]+$/,
      custom: (value: unknown) => {
        if (!value) return true
        const strValue = String(value)
        if (!/^[\d-]+$/.test(strValue)) {
          return '電話番号は数字とハイフンのみで入力してください'
        }
        return true
      }
    }
  }

  const { errors, validateAll, validateSingleField, isAllRequiredFieldsValid } = useFormValidation(formData, validationRules)

  // フォーム保存フックの使用
  const { save, saving, error, success } = useFormSave({
    tableName: 'basic_info',
    uniqueField: 'entry_id',
    redirectPath: '/dashboard',
    onSuccess: (message) => showToast(message, 'success'),
    onError: (error) => showToast(error, 'error')
  })

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    validateSingleField(field, value)
  }

  const handleSubmit = async (e: React.FormEvent, mode: 'save' | 'submit' = 'submit') => {
    e.preventDefault()

    // 完了保存の場合は全体バリデーション
    if (mode === 'submit') {
      if (!validateAll(formData)) {
        showToast('入力内容に誤りがあります', 'error')
        return
      }

      if (!formData.agreement_checked || !formData.privacy_policy_checked) {
        showToast('同意事項にチェックしてください', 'error')
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

      // フォームデータを保存
      await save({
        ...formData,
        entry_id: currentEntryId,
        id: initialData?.id
      }, mode === 'save')

    } catch (err) {
      console.error('Error in form submission:', err)
      showToast('保存中にエラーが発生しました', 'error')
    }
  }

  // 必須項目のチェック（同意事項を含む）
  const isFormValid = () => {
    return isAllRequiredFieldsValid(formData) && 
           formData.agreement_checked && 
           formData.privacy_policy_checked
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <FormField
        label="ダンスジャンル"
        name="dance_style"
        type="select"
        value={formData.dance_style}
        onChange={(e) => handleFieldChange('dance_style', e.target.value)}
        required
        error={errors.dance_style}
      >
        <option value="">選択してください</option>
        <option value="社交ダンス">社交ダンス</option>
        <option value="バレエ・コンテンポラリーダンス">バレエ・コンテンポラリーダンス</option>
        <option value="ジャズダンス">ジャズダンス</option>
        <option value="ストリートダンス全般">ストリートダンス全般</option>
      </FormField>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">参加者情報</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="代表者氏名"
            name="representative_name"
            value={formData.representative_name}
            onChange={(e) => handleFieldChange('representative_name', e.target.value)}
            required
            error={errors.representative_name}
          />
          <FormField
            label="代表者フリガナ"
            name="representative_furigana"
            value={formData.representative_furigana}
            onChange={(e) => handleFieldChange('representative_furigana', e.target.value)}
            required
            placeholder="カタカナで入力"
            error={errors.representative_furigana}
          />
          <FormField
            label="ペア氏名"
            name="partner_name"
            value={formData.partner_name}
            onChange={(e) => handleFieldChange('partner_name', e.target.value)}
            required={formData.dance_style === 'couple'}
            error={errors.partner_name}
          />
          <FormField
            label="ペアフリガナ"
            name="partner_furigana"
            value={formData.partner_furigana}
            onChange={(e) => handleFieldChange('partner_furigana', e.target.value)}
            required={formData.dance_style === 'couple'}
            placeholder="カタカナで入力"
            error={errors.partner_furigana}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="代表者メールアドレス"
          name="representative_email"
          type="email"
          value={formData.representative_email}
          onChange={(e) => handleFieldChange('representative_email', e.target.value)}
          required
          placeholder="example@email.com"
          error={errors.representative_email}
        />
        <FormField
          label="代表者電話番号"
          name="phone_number"
          type="tel"
          value={formData.phone_number}
          onChange={(e) => handleFieldChange('phone_number', e.target.value)}
          required
          placeholder="090-1234-5678"
          error={errors.phone_number}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="振付師氏名"
          name="choreographer"
          value={formData.choreographer}
          onChange={(e) => handleFieldChange('choreographer', e.target.value)}
          placeholder="振付師の氏名"
        />
        <FormField
          label="振付師フリガナ"
          name="choreographer_furigana"
          value={formData.choreographer_furigana}
          onChange={(e) => handleFieldChange('choreographer_furigana', e.target.value)}
          placeholder="カタカナで入力"
        />
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
        <CancelButton onClick={() => router.push('/dashboard')} />
        <div className="space-x-3">
          <TemporarySaveButton
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent, 'save')}
            disabled={saving}
            loading={saving}
          />
          <SaveButton
            type="submit"
            disabled={saving || !isFormValid()}
            loading={saving}
          />
        </div>
      </div>
    </form>
  )
}