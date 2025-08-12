'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { FormField, Alert, Button, DeadlineNoticeAsync } from '@/components/ui'
import { useBaseForm } from '@/hooks'
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
    media_consent_checked: initialData?.media_consent_checked || false,
    privacy_policy_checked: initialData?.privacy_policy_checked || false
  })
  
  // 2025/11/23時点での年齢を計算する関数
  const calculateAge = (birthdate: string | undefined) => {
    if (!birthdate) return ''
    const birth = new Date(birthdate)
    const targetDate = new Date('2025-11-23')
    let age = targetDate.getFullYear() - birth.getFullYear()
    const monthDiff = targetDate.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && targetDate.getDate() < birth.getDate())) {
      age--
    }
    return age.toString()
  }

  // フォームの初期データ
  const formInitialData: BasicInfoFormData = {
    entry_id: entryId || '',
    dance_style: initialData?.dance_style || '',
    category_division: initialData?.category_division || '',
    representative_name: initialData?.representative_name || '',
    representative_furigana: initialData?.representative_furigana || '',
    representative_romaji: initialData?.representative_romaji || '',
    representative_birthdate: initialData?.representative_birthdate || '',
    representative_email: initialData?.representative_email || '',
    partner_name: initialData?.partner_name || '',
    partner_furigana: initialData?.partner_furigana || '',
    partner_romaji: initialData?.partner_romaji || '',
    partner_birthdate: initialData?.partner_birthdate || '',
    phone_number: initialData?.phone_number || '',
    real_name: initialData?.real_name || '',
    real_name_kana: initialData?.real_name_kana || '',
    partner_real_name: initialData?.partner_real_name || '',
    partner_real_name_kana: initialData?.partner_real_name_kana || '',
    emergency_contact_name_1: initialData?.emergency_contact_name_1 || '',
    emergency_contact_phone_1: initialData?.emergency_contact_phone_1 || '',
    emergency_contact_name_2: initialData?.emergency_contact_name_2 || '',
    emergency_contact_phone_2: initialData?.emergency_contact_phone_2 || '',
    agreement_checked: initialData?.agreement_checked || false,
    media_consent_checked: initialData?.media_consent_checked || false,
    privacy_policy_checked: initialData?.privacy_policy_checked || false
  }

  // バリデーションルール（新しいヘルパーを使用）
  const getValidationRules = () => {
    const baseRules = {
      dance_style: { required: true },
      category_division: { required: true },
      representative_name: { required: true, maxLength: 50 },
      representative_furigana: { 
        required: true, 
        maxLength: 50,
        pattern: /^[\u30A0-\u30FF\s]+$/,
        custom: (value: unknown) => {
          if (!value) return 'フリガナは必須です'
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
          if (!value) return 'メールアドレスは必須です'
          const strValue = String(value)
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
            return '正しいメールアドレスを入力してください'
          }
          return true
        }
      },
      phone_number: { 
        required: true,
        pattern: /^0\d{1,4}-?\d{1,4}-?\d{4}$/,
        custom: (value: unknown) => {
          if (!value) return '電話番号は必須です'
          const strValue = String(value)
          if (!/^0\d{1,4}-?\d{1,4}-?\d{4}$/.test(strValue)) {
            return '正しい電話番号を入力してください（例: 090-1234-5678）'
          }
          return true
        }
      },
    } as Record<string, {
      required?: boolean
      pattern?: RegExp
      maxLength?: number
      custom?: (value: unknown) => boolean | string
    }>
    
    // ペア情報は常に必須
    baseRules.partner_name = { 
      required: true,
      maxLength: 50
    }
    baseRules.partner_furigana = { 
      required: true,
      maxLength: 50,
      pattern: /^[\u30A0-\u30FF\s]+$/,
      custom: (value: unknown) => {
        if (!value) return 'ペアフリガナは必須です'
        const strValue = String(value)
        if (!/^[\u30A0-\u30FF\s]+$/.test(strValue)) {
          return 'カタカナで入力してください'
        }
        return true
      }
    }
    
    // 新規追加フィールド
    baseRules.representative_romaji = { required: true, maxLength: 100 }
    baseRules.representative_birthdate = { required: true }
    baseRules.partner_romaji = { required: true, maxLength: 100 }
    baseRules.partner_birthdate = { required: true }
    baseRules.real_name = { required: true, maxLength: 50 }
    baseRules.real_name_kana = { 
      required: true, 
      maxLength: 50,
      pattern: /^[\u30A0-\u30FF\s]+$/,
      custom: (value: unknown) => {
        if (!value) return 'ご本名カナは必須です'
        const strValue = String(value)
        if (!/^[\u30A0-\u30FF\s]+$/.test(strValue)) {
          return 'カタカナで入力してください'
        }
        return true
      }
    }
    baseRules.partner_real_name = { required: true, maxLength: 50 }
    baseRules.partner_real_name_kana = { 
      required: true, 
      maxLength: 50,
      pattern: /^[\u30A0-\u30FF\s]+$/,
      custom: (value: unknown) => {
        if (!value) return 'ペアご本名カナは必須です'
        const strValue = String(value)
        if (!/^[\u30A0-\u30FF\s]+$/.test(strValue)) {
          return 'カタカナで入力してください'
        }
        return true
      }
    }
    baseRules.emergency_contact_name_1 = { required: true, maxLength: 50 }
    baseRules.emergency_contact_phone_1 = { 
      required: true,
      pattern: /^0\d{1,4}-?\d{1,4}-?\d{4}$/,
      custom: (value: unknown) => {
        if (!value) return '緊急連絡先電話番号①は必須です'
        const strValue = String(value)
        if (!/^0\d{1,4}-?\d{1,4}-?\d{4}$/.test(strValue)) {
          return '正しい電話番号を入力してください（例: 090-1234-5678）'
        }
        return true
      }
    }
    // 任意項目
    baseRules.emergency_contact_name_2 = { required: false, maxLength: 50 }
    baseRules.emergency_contact_phone_2 = { 
      required: false,
      pattern: /^0\d{1,4}-?\d{1,4}-?\d{4}$/,
      custom: (value: unknown) => {
        if (!value) return true // 任意項目なので空でもOK
        const strValue = String(value)
        if (!/^0\d{1,4}-?\d{1,4}-?\d{4}$/.test(strValue)) {
          return '正しい電話番号を入力してください（例: 090-1234-5678）'
        }
        return true
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
    success
  } = useBaseForm<BasicInfoFormData>({
    initialData: formInitialData,
    tableName: 'basic_info',
    uniqueField: 'entry_id',
    validationRules: getValidationRules(), // 初期状態のルールを設定
    redirectPath: '/dashboard',
    onSuccess: (message) => showToast(message, 'success'),
    onError: (error) => showToast(error, 'error'),
    validateBeforeSave: false // カスタムバリデーションを行うため
  })

  // カスタムバリデーション関数
  const validateAllWithDynamicRules = () => {
    const currentRules = getValidationRules()
    let hasErrors = false
    const fieldErrors: Record<string, string> = {}
    
    Object.keys(currentRules).forEach(field => {
      const rule = currentRules[field]
      const value = formData[field as keyof BasicInfoFormData]
      
      if (rule.required && (!value || value === '')) {
        hasErrors = true
        fieldErrors[field] = 'この項目は必須です'
      } else if (rule.custom) {
        // カスタムバリデーションはvalueを引数として渡す
        const result = rule.custom(value)
        if (result !== true) {
          hasErrors = true
          fieldErrors[field] = typeof result === 'string' ? result : '入力値が正しくありません'
        }
      } else if (rule.pattern && typeof value === 'string' && value && !rule.pattern.test(value)) {
        hasErrors = true
        fieldErrors[field] = '正しい形式で入力してください'
      }
    })
    
    // エラーを更新（直接変更しない）
    
    return !hasErrors
  }

  const handleCheckboxChange = (field: 'agreement_checked' | 'media_consent_checked' | 'privacy_policy_checked', value: boolean) => {
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

      if (!checkboxes.agreement_checked || !checkboxes.media_consent_checked || !checkboxes.privacy_policy_checked) {
        showToast('すべての同意事項にチェックしてください', 'error')
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

  // 各フィールドのエラーメッセージを保持
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  // フィールド変更時のバリデーション
  const handleFieldChangeWithValidation = (field: keyof BasicInfoFormData, value: string) => {
    handleFieldChange(field, value)
    
    // 動的ルールに基づいてバリデーション
    const currentRules = getValidationRules()
    const rule = currentRules[field]
    
    if (rule) {
      let error = ''
      
      if (rule.required && (!value || value === '')) {
        error = 'この項目は必須です'
      } else if (value) { // 値がある場合のみ追加バリデーション
        if (rule.custom) {
          const result = rule.custom(value)
          if (result !== true) {
            error = typeof result === 'string' ? result : '入力値が正しくありません'
          }
        } else if (rule.pattern && !rule.pattern.test(value)) {
          error = '正しい形式で入力してください'
        }
      }
      
      // エラーメッセージを更新
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        if (error) {
          newErrors[field] = error
        } else {
          delete newErrors[field]
        }
        return newErrors
      })
    }
  }

  // 必須項目のチェック（同意事項を含む）
  const isFormValid = () => {
    const hasAllRequired = validateAllWithDynamicRules()
    const result = hasAllRequired && checkboxes.agreement_checked && checkboxes.media_consent_checked && checkboxes.privacy_policy_checked
    return result
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <DeadlineNoticeAsync deadlineKey="basic_info_deadline" />

      {/* 2025年大会概要 */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-indigo-900 mb-4">2025年大会概要</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex">
            <span className="font-semibold w-20">日　時</span>
            <span>2025年11月23日（日・祝）</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-20">会　場</span>
            <div>
              <div>グランドプリンスホテル新高輪「飛天」</div>
              <div className="text-xs text-gray-600 mt-1">JR・京浜急行 品川駅高輪口</div>
            </div>
          </div>
          <div className="flex">
            <span className="font-semibold w-20">主　催</span>
            <span>株式会社バルカー　株式会社テレビ東京</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-20">特別協賛</span>
            <span>バルカーグループ</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          基本情報の登録
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          ダンスジャンルとエントリーの基本情報を入力してください。
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

        <div>
          <FormField
            label="アマプロ区分"
            name="category_division"
            type="select"
            value={formData.category_division}
            onChange={(e) => handleFieldChangeWithValidation('category_division', e.target.value)}
            required
            error={errors.category_division}
          >
            <option value="">選択してください</option>
            <option value="プロ＆プロ">プロ＆プロ</option>
            <option value="アマ＆アマ">アマ＆アマ</option>
          </FormField>
          <p className="mt-1 text-sm text-gray-500">
            ※プロとアマチュアの混合での出場は不可能です。
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">エントリー情報</h3>
          <p className="text-sm text-gray-600">
            プログラムや当日の選手紹介名として使われます。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="エントリー名"
              name="representative_name"
              value={formData.representative_name}
              onChange={(e) => handleFieldChangeWithValidation('representative_name', e.target.value)}
              required
              error={fieldErrors.representative_name || errors.representative_name}
            />
            <FormField
              label="エントリー名フリガナ"
              name="representative_furigana"
              value={formData.representative_furigana}
              onChange={(e) => handleFieldChangeWithValidation('representative_furigana', e.target.value)}
              required
              placeholder="カタカナで入力"
              error={fieldErrors.representative_furigana || errors.representative_furigana}
            />
            <FormField
              label="エントリー名ローマ字"
              name="representative_romaji"
              value={formData.representative_romaji || ''}
              onChange={(e) => handleFieldChangeWithValidation('representative_romaji', e.target.value)}
              required
              placeholder="例: YAMADA TARO"
              error={fieldErrors.representative_romaji || errors.representative_romaji}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <FormField
                  label="エントリー者誕生日"
                  name="representative_birthdate"
                  type="date"
                  value={formData.representative_birthdate || ''}
                  onChange={(e) => handleFieldChangeWithValidation('representative_birthdate', e.target.value)}
                  required
                  error={fieldErrors.representative_birthdate || errors.representative_birthdate}
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">年齢</label>
                <input
                  type="text"
                  value={calculateAge(formData.representative_birthdate)}
                  readOnly
                  className="w-full rounded-md border-gray-300 bg-gray-100 px-3 py-2 text-sm"
                  placeholder="自動"
                />
              </div>
            </div>
            <FormField
              label="ペア氏名"
              name="partner_name"
              value={formData.partner_name || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_name', e.target.value)}
              required
              error={fieldErrors.partner_name || errors.partner_name}
            />
            <FormField
              label="ペアフリガナ"
              name="partner_furigana"
              value={formData.partner_furigana || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_furigana', e.target.value)}
              required
              placeholder="カタカナで入力"
              error={fieldErrors.partner_furigana || errors.partner_furigana}
            />
            <FormField
              label="ペア名ローマ字"
              name="partner_romaji"
              value={formData.partner_romaji || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_romaji', e.target.value)}
              required
              placeholder="例: SUZUKI HANAKO"
              error={fieldErrors.partner_romaji || errors.partner_romaji}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <FormField
                  label="ペア誕生日"
                  name="partner_birthdate"
                  type="date"
                  value={formData.partner_birthdate || ''}
                  onChange={(e) => handleFieldChangeWithValidation('partner_birthdate', e.target.value)}
                  required
                  error={fieldErrors.partner_birthdate || errors.partner_birthdate}
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 mb-1">年齢</label>
                <input
                  type="text"
                  value={calculateAge(formData.partner_birthdate)}
                  readOnly
                  className="w-full rounded-md border-gray-300 bg-gray-100 px-3 py-2 text-sm"
                  placeholder="自動"
                />
              </div>
            </div>
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
            error={fieldErrors.representative_email || errors.representative_email}
          />
          <FormField
            label="代表者電話番号"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={(e) => handleFieldChangeWithValidation('phone_number', e.target.value)}
            required
            placeholder="090-1234-5678"
            error={fieldErrors.phone_number || errors.phone_number}
          />
        </div>

        {/* 緊急連絡先情報セクション */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">緊急連絡先情報</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="ご本名"
              name="real_name"
              value={formData.real_name || ''}
              onChange={(e) => handleFieldChangeWithValidation('real_name', e.target.value)}
              required
              error={fieldErrors.real_name || errors.real_name}
            />
            <FormField
              label="ご本名カナ"
              name="real_name_kana"
              value={formData.real_name_kana || ''}
              onChange={(e) => handleFieldChangeWithValidation('real_name_kana', e.target.value)}
              required
              placeholder="カタカナで入力"
              error={fieldErrors.real_name_kana || errors.real_name_kana}
            />
            <FormField
              label="ペアご本名"
              name="partner_real_name"
              value={formData.partner_real_name || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_real_name', e.target.value)}
              required
              error={fieldErrors.partner_real_name || errors.partner_real_name}
            />
            <FormField
              label="ペアご本名カナ"
              name="partner_real_name_kana"
              value={formData.partner_real_name_kana || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_real_name_kana', e.target.value)}
              required
              placeholder="カタカナで入力"
              error={fieldErrors.partner_real_name_kana || errors.partner_real_name_kana}
            />
            <FormField
              label="緊急連絡先氏名①"
              name="emergency_contact_name_1"
              value={formData.emergency_contact_name_1 || ''}
              onChange={(e) => handleFieldChangeWithValidation('emergency_contact_name_1', e.target.value)}
              required
              error={fieldErrors.emergency_contact_name_1 || errors.emergency_contact_name_1}
            />
            <FormField
              label="緊急連絡先電話番号①"
              name="emergency_contact_phone_1"
              type="tel"
              value={formData.emergency_contact_phone_1 || ''}
              onChange={(e) => handleFieldChangeWithValidation('emergency_contact_phone_1', e.target.value)}
              required
              placeholder="090-1234-5678"
              error={fieldErrors.emergency_contact_phone_1 || errors.emergency_contact_phone_1}
            />
            <FormField
              label="緊急連絡先氏名②"
              name="emergency_contact_name_2"
              value={formData.emergency_contact_name_2 || ''}
              onChange={(e) => handleFieldChangeWithValidation('emergency_contact_name_2', e.target.value)}
              error={fieldErrors.emergency_contact_name_2 || errors.emergency_contact_name_2}
            />
            <FormField
              label="緊急連絡先電話番号②"
              name="emergency_contact_phone_2"
              type="tel"
              value={formData.emergency_contact_phone_2 || ''}
              onChange={(e) => handleFieldChangeWithValidation('emergency_contact_phone_2', e.target.value)}
              placeholder="090-1234-5678"
              error={fieldErrors.emergency_contact_phone_2 || errors.emergency_contact_phone_2}
            />
          </div>
          
          <p className="text-sm text-gray-600">
            ※ペアで緊急連絡先が異なる場合は②にも記入してください
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">参加資格</h3>
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
            <h3 className="text-sm font-medium text-gray-900 mb-2">写真・映像使用許諾</h3>
            <div className="text-sm text-gray-600 mb-3">
              <p>バルカーカップで撮影された映像と写真・氏名等の、テレビ・新聞・雑誌・インターネット等への掲載権および肖像権は主催者に属します。</p>
            </div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={checkboxes.media_consent_checked}
                onChange={(e) => handleCheckboxChange('media_consent_checked', e.target.checked)}
                required
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                写真・映像使用許諾を確認し、同意します <span className="text-red-500">*</span>
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