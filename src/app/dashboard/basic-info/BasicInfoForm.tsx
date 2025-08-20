'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { updateFormStatus, checkBasicInfoCompletion } from '@/lib/status-utils'
import { FormField, Alert, Button, DeadlineNoticeAsync, FileUploadField } from '@/components/ui'
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
  const [bankSlipFile, setBankSlipFile] = useState<{file_name: string; file_path: string; url?: string} | null>(null)

  // 振込確認用紙ファイルを読み込む
  useEffect(() => {
    const loadBankSlipFile = async () => {
      if (!entryId) return
      
      console.log('[BANK SLIP LOAD] === 振込確認用紙読み込み開始 ===')
      try {
        const { data: fileData, error: fileError } = await supabase
          .from('entry_files')
          .select('*')
          .eq('entry_id', entryId)
          .eq('purpose', 'bank_slip')
          .order('uploaded_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fileError) {
          console.error('[BANK SLIP LOAD] ファイル取得エラー:', fileError)
          return
        }

        if (fileData) {
          console.log('[BANK SLIP LOAD] 振込確認用紙ファイル発見:', fileData)
          
          // 署名付きURLを取得
          const { data: urlData } = await supabase.storage
            .from('files')
            .createSignedUrl(fileData.file_path, 3600)

          setBankSlipFile({
            file_name: fileData.file_name,
            file_path: fileData.file_path,
            url: urlData?.signedUrl
          })
          
          console.log('[BANK SLIP LOAD] 振込確認用紙状態更新完了')
        } else {
          console.log('[BANK SLIP LOAD] 振込確認用紙ファイルなし')
          setBankSlipFile(null)
        }
      } catch (error) {
        console.error('[BANK SLIP LOAD] 読み込みエラー:', error)
      }
    }

    loadBankSlipFile()
  }, [entryId, supabase])

  // 年齢計算関数（2025年11月23日時点）
  const calculateAge = (birthdate: string): string => {
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
    guardian_name: initialData?.guardian_name || '',
    guardian_phone: initialData?.guardian_phone || '',
    guardian_email: initialData?.guardian_email || '',
    partner_guardian_name: initialData?.partner_guardian_name || '',
    partner_guardian_phone: initialData?.partner_guardian_phone || '',
    partner_guardian_email: initialData?.partner_guardian_email || '',
    agreement_checked: initialData?.agreement_checked || false,
    media_consent_checked: initialData?.media_consent_checked || false,
    privacy_policy_checked: initialData?.privacy_policy_checked || false
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
    validationRules: {}, // 初期ルールは空にする
    redirectPath: '/dashboard',
    onSuccess: async (message) => {
      console.log('[BASIC INFO SUCCESS] === onSuccess コールバック開始 ===')
      console.log('[BASIC INFO SUCCESS] 成功メッセージ:', message)
      showToast(message, 'success')
      
      // フォーム保存成功後にステータス更新
      if (entryId) {
        console.log('[BASIC INFO SUCCESS] entryId存在、ステータス更新チェック開始')
        console.log('[BASIC INFO SUCCESS] 現在のformData:', formData)
        console.log('[BASIC INFO SUCCESS] 現在のcheckboxes:', checkboxes)
        
        const hasAnyData = Object.values(formData).some(value => value && value.toString().trim() !== '') || 
                         Object.values(checkboxes).some(value => value === true)
        const isComplete = checkBasicInfoCompletion(formData, checkboxes)
        console.log('[BASIC INFO SUCCESS] データ存在判定:', hasAnyData)
        console.log('[BASIC INFO SUCCESS] 完了判定結果:', isComplete)
        
        await updateFormStatus('basic_info', entryId, isComplete, hasAnyData)
        console.log('[BASIC INFO SUCCESS] ステータス更新処理完了')
      } else {
        console.log('[BASIC INFO SUCCESS] entryIdが存在しないためステータス更新をスキップ')
      }
      console.log('[BASIC INFO SUCCESS] === onSuccess コールバック終了 ===')
    },
    onError: (error) => showToast(error, 'error'),
    validateBeforeSave: false // カスタムバリデーションを行うため
  })

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
      representative_romaji: { required: true },
      representative_birthdate: { required: true },
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
      real_name: { required: true },
      real_name_kana: { required: true },
      emergency_contact_name_1: { required: true },
      emergency_contact_phone_1: { required: true },
      partner_name: { 
        required: true,
        maxLength: 50
      },
      partner_furigana: { 
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
      },
      partner_romaji: { required: true },
      partner_birthdate: { required: true },
      partner_real_name: { required: true },
      partner_real_name_kana: { required: true },
    } as Record<string, {
      required?: boolean
      pattern?: RegExp
      maxLength?: number
      custom?: (value: unknown) => boolean | string
    }>

    // 緊急連絡先電話番号のバリデーション（必須項目として上書き）
    baseRules.emergency_contact_phone_1 = {
      required: true,
      custom: (value: unknown) => {
        if (!value) return '緊急連絡先電話番号は必須です'
        const strValue = String(value)
        if (!/^0\d{1,4}-?\d{1,4}-?\d{4}$/.test(strValue)) {
          return '正しい電話番号を入力してください（例: 090-1234-5678）'
        }
        return true
      }
    }

    baseRules.emergency_contact_phone_2 = {
      custom: (value: unknown) => {
        if (!value) return true // 任意項目
        const strValue = String(value)
        if (!/^0\d{1,4}-?\d{1,4}-?\d{4}$/.test(strValue)) {
          return '正しい電話番号を入力してください（例: 090-1234-5678）'
        }
        return true
      }
    }

    // 18歳未満の場合、保護者情報を必須にする
    const repAge = formData.representative_birthdate ? parseInt(calculateAge(formData.representative_birthdate)) : 999
    const partnerAge = formData.partner_birthdate ? parseInt(calculateAge(formData.partner_birthdate)) : 999

    if (repAge < 18) {
      baseRules.guardian_name = { required: true }
      baseRules.guardian_phone = { 
        required: true,
        custom: (value: unknown) => {
          const strValue = String(value || '')
          if (!strValue) return '保護者の電話番号は必須です'
          if (!/^0\d{1,4}-?\d{1,4}-?\d{4}$/.test(strValue)) {
            return '正しい電話番号を入力してください'
          }
          return true
        }
      }
      baseRules.guardian_email = { 
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: (value: unknown) => {
          const strValue = String(value || '')
          if (!strValue) return '保護者のメールアドレスは必須です'
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
            return '正しいメールアドレスを入力してください'
          }
          return true
        }
      }
    }

    if (partnerAge < 18) {
      baseRules.partner_guardian_name = { required: true }
      baseRules.partner_guardian_phone = { 
        required: true,
        custom: (value: unknown) => {
          const strValue = String(value || '')
          if (!strValue) return 'ペア保護者の電話番号は必須です'
          if (!/^0\d{1,4}-?\d{1,4}-?\d{4}$/.test(strValue)) {
            return '正しい電話番号を入力してください'
          }
          return true
        }
      }
      baseRules.partner_guardian_email = { 
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        custom: (value: unknown) => {
          const strValue = String(value || '')
          if (!strValue) return 'ペア保護者のメールアドレスは必須です'
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
            return '正しいメールアドレスを入力してください'
          }
          return true
        }
      }
    }
    
    return baseRules
  }

  /*
  // フォーム完成度チェック関数（ステータス表示用・将来使用予定）
  const _checkFormCompletionStatus = () => {
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
  */

  const handleCheckboxChange = (field: 'agreement_checked' | 'media_consent_checked' | 'privacy_policy_checked', value: boolean) => {
    setCheckboxes(prev => ({ ...prev, [field]: value }))
    handleFieldChange(field, value)
  }

  const handleSubmit = async () => {
    // バリデーションはステータスチェック用のみ（保存は常に可能）

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


      // デバッグ: 保存するデータをログ出力
      console.log('=== [BASIC INFO SAVE] 保存処理開始 ===')
      console.log('[BASIC INFO SAVE] entryId:', entryId)
      console.log('[BASIC INFO SAVE] currentEntryId:', currentEntryId)
      console.log('[BASIC INFO SAVE] formData:', JSON.stringify(formData, null, 2))
      console.log('[BASIC INFO SAVE] checkboxes:', JSON.stringify(checkboxes, null, 2))
      
      const saveData = {
        ...formData,
        ...checkboxes,
        entry_id: currentEntryId
      }
      
      console.log('[BASIC INFO SAVE] 最終的な保存データ（全フィールド）:')
      Object.keys(saveData).forEach(key => {
        const value = saveData[key as keyof typeof saveData]
        console.log(`  ${key}: "${value}" (型: ${typeof value})`)
      })
      
      // 必須フィールドの事前チェック（デバッグ用）
      console.log('[BASIC INFO SAVE] === 事前必須フィールドチェック ===')
      const preCheckResult = checkBasicInfoCompletion(formData, checkboxes)
      console.log('[BASIC INFO SAVE] 事前チェック結果:', preCheckResult)
      console.log('[BASIC INFO SAVE] ================================')

      console.log('[BASIC INFO SAVE] フォーム保存開始')
      
      // フォームデータを保存（onSuccessでステータス更新される）
      await saveForm(true)
      console.log('[BASIC INFO SAVE] フォーム保存完了')

      // 保存成功後にダッシュボードにリダイレクト
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)

    } catch (error) {
      console.error('保存エラーの詳細:', error)
      showToast('保存中にエラーが発生しました', 'error')
    }
  }

  // 各フィールドのエラーメッセージを保持
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  // フィールド変更時のバリデーション
  const handleFieldChangeWithValidation = async (field: keyof BasicInfoFormData, value: string) => {
    console.log(`[FIELD CHANGE] === フィールド変更: ${field} ===`)
    console.log(`[FIELD CHANGE] 新しい値: "${value}"`)
    
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
    
    // フィールド変更時にリアルタイムでステータスをチェック
    if (entryId) {
      console.log(`[FIELD CHANGE] ステータスリアルタイムチェック開始`)
      setTimeout(async () => {
        try {
          const updatedFormData = { ...formData, [field]: value }
          console.log(`[FIELD CHANGE] 更新後のformData:`, updatedFormData)
          
          const hasAnyData = Object.values(updatedFormData).some(val => val && val.toString().trim() !== '') || 
                          Object.values(checkboxes).some(val => val === true)
          const isComplete = checkBasicInfoCompletion(updatedFormData, checkboxes)
          
          console.log(`[FIELD CHANGE] リアルタイムチェック結果 - hasData: ${hasAnyData}, isComplete: ${isComplete}`)
          
          await updateFormStatus('basic_info', entryId, isComplete, hasAnyData)
          console.log(`[FIELD CHANGE] ステータス更新完了`)
        } catch (error) {
          console.error(`[FIELD CHANGE] ステータス更新エラー:`, error)
        }
      }, 500) // 0.5秒後に実行（入力完了を待つ）
    }
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
              placeholder="Yamada Taro"
              required
              error={fieldErrors.representative_romaji || errors.representative_romaji}
            />
            <FormField
              label={`代表者生年月日${formData.representative_birthdate ? ` (大会時点: ${calculateAge(formData.representative_birthdate)}歳)` : ''}`}
              name="representative_birthdate"
              type="date"
              value={formData.representative_birthdate || ''}
              onChange={(e) => handleFieldChangeWithValidation('representative_birthdate', e.target.value)}
              max="2025-11-23"
              min="1920-01-01"
              required
              error={fieldErrors.representative_birthdate || errors.representative_birthdate}
            />
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
              label="ペア氏名ローマ字"
              name="partner_romaji"
              value={formData.partner_romaji || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_romaji', e.target.value)}
              placeholder="Tanaka Hanako"
              required
              error={fieldErrors.partner_romaji || errors.partner_romaji}
            />
            <FormField
              label={`ペア生年月日${formData.partner_birthdate ? ` (大会時点: ${calculateAge(formData.partner_birthdate)}歳)` : ''}`}
              name="partner_birthdate"
              type="date"
              value={formData.partner_birthdate || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_birthdate', e.target.value)}
              max="2025-11-23"
              min="1920-01-01"
              required
              error={fieldErrors.partner_birthdate || errors.partner_birthdate}
            />
            
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
        </div>

        {/* 振込確認用紙アップロードセクション */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">振込確認用紙アップロード</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="text-sm text-blue-800 space-y-2">
              <div>
                <p className="font-medium">■オンライン予選エントリー料</p>
                <p className="ml-4">8,000円</p>
              </div>
              <div>
                <p className="font-medium">■お振込先</p>
                <div className="ml-4 space-y-1">
                  <p>三井住友銀行</p>
                  <p>新宿西口支店</p>
                  <p>普通　２２４１７６９</p>
                  <p>カ）バルカー</p>
                </div>
              </div>
            </div>
          </div>

          <FileUploadField
            label="振込確認用紙"
            value={null}
            onChange={async (file) => {
              console.log('[BANK SLIP UPLOAD] === 振込確認用紙アップロード開始 ===')
              console.log('[BANK SLIP UPLOAD] 選択されたファイル:', file.name)
              console.log('[BANK SLIP UPLOAD] ファイルサイズ:', (file.size / 1024 / 1024).toFixed(2), 'MB')
              console.log('[BANK SLIP UPLOAD] ファイルタイプ:', file.type)
              
              if (!entryId) {
                console.error('[BANK SLIP UPLOAD] entryIdが存在しません')
                showToast('基本情報を先に保存してください', 'error')
                return
              }
              
              try {
                // ファイルアップロード処理
                const fileExt = file.name.split('.').pop()
                const fileName = `${entryId}/bank_slip_${Date.now()}.${fileExt}`
                
                console.log('[BANK SLIP UPLOAD] アップロード先:', fileName)
                
                const { error: uploadError } = await supabase.storage
                  .from('files')
                  .upload(fileName, file)
                
                if (uploadError) {
                  console.error('[BANK SLIP UPLOAD] ストレージアップロードエラー:', uploadError)
                  throw uploadError
                }
                
                // ファイル情報をデータベースに保存
                const insertData = {
                  entry_id: entryId,
                  file_type: 'photo',
                  file_name: file.name,
                  file_path: fileName,
                  purpose: 'bank_slip',
                  uploaded_at: new Date().toISOString()
                }
                
                console.log('[BANK SLIP UPLOAD] データベース保存:', insertData)
                
                const { error: dbError } = await supabase
                  .from('entry_files')
                  .insert(insertData)
                
                if (dbError) {
                  console.error('[BANK SLIP UPLOAD] データベース保存エラー:', dbError)
                  throw dbError
                }
                
                // 署名付きURLを取得してプレビュー用に設定
                const { data: urlData } = await supabase.storage
                  .from('files')
                  .createSignedUrl(fileName, 3600)

                setBankSlipFile({
                  file_name: file.name,
                  file_path: fileName,
                  url: urlData?.signedUrl
                })
                
                console.log('[BANK SLIP UPLOAD] アップロード成功、状態更新完了')
                showToast('振込確認用紙をアップロードしました', 'success')
                
              } catch (error) {
                console.error('[BANK SLIP UPLOAD] アップロードエラー:', error)
                showToast('振込確認用紙のアップロードに失敗しました', 'error')
              }
            }}
            category="image"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            maxSizeMB={10}
            required
            placeholder={{
              title: "振込確認用紙をアップロード",
              formats: "JPG, PNG, GIF など（最大10MB）"
            }}
          />
          
          {/* アップロード済みファイルのプレビュー（常に表示） */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">アップロード状況</h4>
            {bankSlipFile ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">アップロード済み</p>
                    <p className="text-xs text-green-700">{bankSlipFile.file_name}</p>
                  </div>
                  <div className="flex space-x-2">
                    {bankSlipFile.url && (
                      <button
                        type="button"
                        onClick={() => window.open(bankSlipFile.url, '_blank')}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        プレビュー
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        console.log('[BANK SLIP DELETE] === 振込確認用紙削除開始 ===')
                        if (!window.confirm('振込確認用紙を削除してもよろしいですか？')) {
                          return
                        }
                        
                        try {
                          // ストレージから削除
                          const { error: storageError } = await supabase.storage
                            .from('files')
                            .remove([bankSlipFile.file_path])

                          if (storageError) {
                            console.error('[BANK SLIP DELETE] ストレージ削除エラー:', storageError)
                          }

                          // データベースから削除
                          const { error: dbError } = await supabase
                            .from('entry_files')
                            .delete()
                            .eq('entry_id', entryId)
                            .eq('purpose', 'bank_slip')

                          if (dbError) {
                            console.error('[BANK SLIP DELETE] データベース削除エラー:', dbError)
                          }

                          setBankSlipFile(null)
                          console.log('[BANK SLIP DELETE] 削除完了')
                          showToast('振込確認用紙を削除しました', 'success')
                        } catch (error) {
                          console.error('[BANK SLIP DELETE] 削除エラー:', error)
                          showToast('振込確認用紙の削除に失敗しました', 'error')
                        }
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">振込確認用紙はまだアップロードされていません</p>
                <p className="text-xs text-gray-500 mt-1">上記のフォームからファイルを選択してアップロードしてください</p>
              </div>
            )}
          </div>
        </div>

        {/* 本名情報セクション */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">本名情報</h3>
          <p className="text-sm text-gray-600 mb-4">
            ※エントリー名と本名が異なる場合のみ入力してください
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="代表者本名"
              name="real_name"
              value={formData.real_name || ''}
              onChange={(e) => handleFieldChangeWithValidation('real_name', e.target.value)}
              placeholder="山田太郎"
              required
              error={fieldErrors.real_name || errors.real_name}
            />
            
            <FormField
              label="代表者本名カナ"
              name="real_name_kana"
              value={formData.real_name_kana || ''}
              onChange={(e) => handleFieldChangeWithValidation('real_name_kana', e.target.value)}
              placeholder="ヤマダタロウ"
              required
              error={fieldErrors.real_name_kana || errors.real_name_kana}
            />
            
            <FormField
              label="ペア本名"
              name="partner_real_name"
              value={formData.partner_real_name || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_real_name', e.target.value)}
              placeholder="田中花子"
              required
              error={fieldErrors.partner_real_name || errors.partner_real_name}
            />
            
            <FormField
              label="ペア本名カナ"
              name="partner_real_name_kana"
              value={formData.partner_real_name_kana || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_real_name_kana', e.target.value)}
              placeholder="タナカハナコ"
              required
              error={fieldErrors.partner_real_name_kana || errors.partner_real_name_kana}
            />
          </div>
        </div>

        {/* 緊急連絡先情報セクション */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">緊急連絡先情報</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="緊急連絡先①氏名"
              name="emergency_contact_name_1"
              value={formData.emergency_contact_name_1 || ''}
              onChange={(e) => handleFieldChangeWithValidation('emergency_contact_name_1', e.target.value)}
              placeholder="山田太郎"
              required
              error={fieldErrors.emergency_contact_name_1 || errors.emergency_contact_name_1}
            />
            
            <FormField
              label="緊急連絡先①電話番号"
              name="emergency_contact_phone_1"
              type="tel"
              value={formData.emergency_contact_phone_1 || ''}
              onChange={(e) => handleFieldChangeWithValidation('emergency_contact_phone_1', e.target.value)}
              placeholder="090-1234-5678"
              required
              error={fieldErrors.emergency_contact_phone_1 || errors.emergency_contact_phone_1}
            />
            
            <FormField
              label="緊急連絡先②氏名"
              name="emergency_contact_name_2"
              value={formData.emergency_contact_name_2 || ''}
              onChange={(e) => handleFieldChangeWithValidation('emergency_contact_name_2', e.target.value)}
              placeholder="山田花子"
            />
            
            <FormField
              label="緊急連絡先②電話番号"
              name="emergency_contact_phone_2"
              type="tel"
              value={formData.emergency_contact_phone_2 || ''}
              onChange={(e) => handleFieldChangeWithValidation('emergency_contact_phone_2', e.target.value)}
              placeholder="090-5678-1234"
              error={fieldErrors.emergency_contact_phone_2 || errors.emergency_contact_phone_2}
            />
          </div>
          
          <p className="text-sm text-gray-600 mt-2">
            ※ペアで緊急連絡先が異なる場合は②にも記入してください
          </p>
        </div>

        {/* 保護者情報セクション（18歳未満の場合） */}
        {(formData.representative_birthdate && parseInt(calculateAge(formData.representative_birthdate)) < 18) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              代表者保護者情報
              <span className="text-sm text-red-500 ml-2">（18歳未満のため必須）</span>
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800">
                中学生以下の未成年選手につきましては、保護者の同伴が必要となります。<br />
                詳細は事務局より追ってご案内申し上げます。
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="保護者氏名"
                name="guardian_name"
                value={formData.guardian_name || ''}
                onChange={(e) => handleFieldChangeWithValidation('guardian_name', e.target.value)}
                required
                error={fieldErrors.guardian_name || errors.guardian_name}
              />
              
              <FormField
                label="保護者電話番号"
                name="guardian_phone"
                type="tel"
                value={formData.guardian_phone || ''}
                onChange={(e) => handleFieldChangeWithValidation('guardian_phone', e.target.value)}
                required
                placeholder="090-1234-5678"
                error={fieldErrors.guardian_phone || errors.guardian_phone}
              />
              
              <FormField
                label="保護者メールアドレス"
                name="guardian_email"
                type="email"
                value={formData.guardian_email || ''}
                onChange={(e) => handleFieldChangeWithValidation('guardian_email', e.target.value)}
                required
                placeholder="guardian@example.com"
                error={fieldErrors.guardian_email || errors.guardian_email}
              />
            </div>
          </div>
        )}
        
        {(formData.partner_birthdate && parseInt(calculateAge(formData.partner_birthdate)) < 18) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ペア保護者情報
              <span className="text-sm text-red-500 ml-2">（18歳未満のため必須）</span>
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800">
                中学生以下の未成年選手につきましては、保護者の同伴が必要となります。<br />
                詳細は事務局より追ってご案内申し上げます。
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="ペア保護者氏名"
                name="partner_guardian_name"
                value={formData.partner_guardian_name || ''}
                onChange={(e) => handleFieldChangeWithValidation('partner_guardian_name', e.target.value)}
                required
                error={fieldErrors.partner_guardian_name || errors.partner_guardian_name}
              />
              
              <FormField
                label="ペア保護者電話番号"
                name="partner_guardian_phone"
                type="tel"
                value={formData.partner_guardian_phone || ''}
                onChange={(e) => handleFieldChangeWithValidation('partner_guardian_phone', e.target.value)}
                required
                placeholder="090-1234-5678"
                error={fieldErrors.partner_guardian_phone || errors.partner_guardian_phone}
              />
              
              <FormField
                label="ペア保護者メールアドレス"
                name="partner_guardian_email"
                type="email"
                value={formData.partner_guardian_email || ''}
                onChange={(e) => handleFieldChangeWithValidation('partner_guardian_email', e.target.value)}
                required
                placeholder="guardian@example.com"
                error={fieldErrors.partner_guardian_email || errors.partner_guardian_email}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">参加資格</h3>
            <div className="text-sm text-gray-600 space-y-1 mb-3">
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
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </form>
  )
}