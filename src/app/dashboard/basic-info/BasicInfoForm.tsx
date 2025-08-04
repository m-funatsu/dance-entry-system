'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { FormField, Alert, Button } from '@/components/ui'
import { useBaseForm } from '@/hooks'
import { ValidationPresets, Validators } from '@/lib/validation'
import type { BasicInfo, BasicInfoFormData } from '@/lib/types'

interface BasicInfoFormProps {
  userId: string
  entryId: string | null
  initialData: BasicInfo | null
}

export default function BasicInfoForm({ userId, entryId, initialData }: BasicInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const [checkboxes, setCheckboxes] = useState({
    agreement_checked: initialData?.agreement_checked || false,
    privacy_policy_checked: initialData?.privacy_policy_checked || false
  })

  // フォームの初期データ
  const formInitialData: BasicInfoFormData = {
    entry_id: entryId || '',
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
  }

  // バリデーションルール（新しいヘルパーを使用）
  const getValidationRules = (danceStyle: string) => {
    const baseRules = {
      dance_style: { required: true },
      representative_name: ValidationPresets.name,
      representative_furigana: ValidationPresets.nameKana,
      representative_email: ValidationPresets.email,
      phone_number: ValidationPresets.phone,
      choreographer: ValidationPresets.optionalText(50),
      choreographer_furigana: {
        required: false,
        custom: (formData: any) => {
          // 振付師が入力されている場合のみカタカナチェック
          if (formData.choreographer && formData.choreographer_furigana) {
            const pattern = /^[\u30A0-\u30FF\s]+$/
            if (!pattern.test(formData.choreographer_furigana)) {
              return '振付師フリガナはカタカナで入力してください'
            }
          }
          return true
        }
      }
    } as Record<string, {
      required?: boolean
      pattern?: RegExp
      custom?: (value: unknown) => boolean | string
    }>
    
    // ダンススタイルが'couple'の場合のみパートナー情報を必須に
    if (danceStyle === 'couple') {
      baseRules.partner_name = { 
        required: true,
        custom: (value: unknown) => {
          const strValue = String(value || '')
          if (!strValue) {
            return 'ペアの場合は必須です'
          }
          return true
        }
      }
      baseRules.partner_furigana = { 
        required: true,
        pattern: /^[\u30A0-\u30FF\s]+$/,
        custom: (value: unknown) => {
          const strValue = String(value || '')
          if (!strValue) return 'ペアの場合は必須です'
          if (!/^[\u30A0-\u30FF\s]+$/.test(strValue)) {
            return 'カタカナで入力してください'
          }
          return true
        }
      }
    }
    
    return baseRules
  }

  // useBaseFormフックを使用
  const {
    formData,
    handleFieldChange,
    save: saveForm,
    saving,
    errors,
    error,
    success,
    validateField
  } = useBaseForm<BasicInfoFormData>({
    initialData: formInitialData,
    tableName: 'basic_info',
    uniqueField: 'entry_id',
    validationRules: getValidationRules(formInitialData.dance_style), // 初期状態のルールを設定
    redirectPath: '/dashboard',
    onSuccess: (message) => showToast(message, 'success'),
    onError: (error) => showToast(error, 'error'),
    validateBeforeSave: false // カスタムバリデーションを行うため
  })

  // カスタムバリデーション関数
  const validateAllWithDynamicRules = () => {
    const currentRules = getValidationRules(formData.dance_style)
    let hasErrors = false
    const fieldErrors: Record<string, string> = {}
    
    Object.keys(currentRules).forEach(field => {
      const rule = currentRules[field]
      const value = formData[field as keyof BasicInfoFormData]
      
      if (rule.required && (!value || value === '')) {
        hasErrors = true
        fieldErrors[field] = 'Required but empty'
      } else if (rule.custom) {
        const result = rule.custom(formData)
        if (result !== true) {
          hasErrors = true
          fieldErrors[field] = typeof result === 'string' ? result : 'Custom validation failed'
        }
      } else if (rule.pattern && typeof value === 'string' && value && !rule.pattern.test(value)) {
        hasErrors = true
        fieldErrors[field] = 'Pattern mismatch'
      }
    })
    
    console.log('validateAllWithDynamicRules debug:', {
      currentRules: Object.keys(currentRules),
      fieldErrors,
      hasErrors,
      formData,
      detailedRules: Object.entries(currentRules).map(([field, rule]) => ({
        field,
        required: rule.required,
        hasCustom: !!rule.custom,
        hasPattern: !!rule.pattern,
        value: formData[field as keyof BasicInfoFormData]
      }))
    })
    
    return !hasErrors
  }

  const handleCheckboxChange = (field: 'agreement_checked' | 'privacy_policy_checked', value: boolean) => {
    setCheckboxes(prev => ({ ...prev, [field]: value }))
    handleFieldChange(field, value)
  }

  const handleSubmit = async (isTemporary = false) => {
    // 完了保存の場合は全体バリデーション
    if (!isTemporary) {
      if (!validateAllWithDynamicRules()) {
        showToast('入力内容に誤りがあります', 'error')
        return
      }

      if (!checkboxes.agreement_checked || !checkboxes.privacy_policy_checked) {
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
        handleFieldChange('entry_id', currentEntryId)
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
      await saveForm(isTemporary)

    } catch {
      showToast('保存中にエラーが発生しました', 'error')
    }
  }

  // フィールド変更時のバリデーション
  const handleFieldChangeWithValidation = (field: keyof BasicInfoFormData, value: string) => {
    handleFieldChange(field, value)
    validateField(field)
  }

  // 必須項目のチェック（同意事項を含む）
  const isFormValid = () => {
    const hasAllRequired = validateAllWithDynamicRules()
    const result = hasAllRequired && checkboxes.agreement_checked && checkboxes.privacy_policy_checked
    console.log('isFormValid debug:', {
      hasAllRequired,
      agreement_checked: checkboxes.agreement_checked,
      privacy_policy_checked: checkboxes.privacy_policy_checked,
      formData,
      result
    })
    return result
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          基本情報の登録
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          ダンスジャンルと参加者の基本情報を入力してください。
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          label="ダンスジャンル"
          name="dance_style"
          type="select"
          value={formData.dance_style}
          onChange={(e) => handleFieldChangeWithValidation('dance_style', e.target.value)}
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
              onChange={(e) => handleFieldChangeWithValidation('representative_name', e.target.value)}
              required
              error={errors.representative_name}
            />
            <FormField
              label="代表者フリガナ"
              name="representative_furigana"
              value={formData.representative_furigana}
              onChange={(e) => handleFieldChangeWithValidation('representative_furigana', e.target.value)}
              required
              placeholder="カタカナで入力"
              error={errors.representative_furigana}
            />
            <FormField
              label="ペア氏名"
              name="partner_name"
              value={formData.partner_name || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_name', e.target.value)}
              required={formData.dance_style === 'couple'}
              error={errors.partner_name}
            />
            <FormField
              label="ペアフリガナ"
              name="partner_furigana"
              value={formData.partner_furigana || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_furigana', e.target.value)}
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
            onChange={(e) => handleFieldChangeWithValidation('representative_email', e.target.value)}
            required
            placeholder="example@email.com"
            error={errors.representative_email}
          />
          <FormField
            label="代表者電話番号"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={(e) => handleFieldChangeWithValidation('phone_number', e.target.value)}
            required
            placeholder="090-1234-5678"
            error={errors.phone_number}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="振付師氏名"
            name="choreographer"
            value={formData.choreographer || ''}
            onChange={(e) => handleFieldChange('choreographer', e.target.value)}
            placeholder="振付師の氏名"
          />
          <FormField
            label="振付師フリガナ"
            name="choreographer_furigana"
            value={formData.choreographer_furigana || ''}
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
                checked={checkboxes.agreement_checked}
                onChange={(e) => handleCheckboxChange('agreement_checked', e.target.checked)}
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
                checked={checkboxes.privacy_policy_checked}
                onChange={(e) => handleCheckboxChange('privacy_policy_checked', e.target.checked)}
                required
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                プライバシーポリシーに同意する <span className="text-red-500">*</span>
              </span>
            </label>
          </div>
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/dashboard')}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit(true)}
            disabled={saving}
          >
            一時保存
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving || !isFormValid()}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </form>
  )
}