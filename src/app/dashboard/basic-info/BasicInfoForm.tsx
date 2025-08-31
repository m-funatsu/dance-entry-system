'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { updateFormStatus, checkBasicInfoCompletion } from '@/lib/status-utils'
import { FormField, Alert, Button, DeadlineNoticeAsync, FileUploadField } from '@/components/ui'
import { useBaseForm } from '@/hooks'
import { useFileUploadV2 } from '@/hooks/useFileUploadV2'
import Image from 'next/image'
import type { BasicInfo, BasicInfoFormData } from '@/lib/types'

interface BasicInfoFormProps {
  userId: string
  entryId: string | null
  initialData: BasicInfo | null
  isEditable?: boolean
}

export default function BasicInfoForm({ userId, entryId, initialData, isEditable = true }: BasicInfoFormProps) {
  const supabase = createClient()
  const { showToast } = useToast()
  const [checkboxes, setCheckboxes] = useState({
    agreement_checked: initialData?.agreement_checked || false,
    media_consent_checked: initialData?.media_consent_checked || false,
    privacy_policy_checked: initialData?.privacy_policy_checked || false
  })
  const [bankSlipFile, setBankSlipFile] = useState<{file_name: string; file_path: string; url?: string} | null>(null)

  // ファイルアップロードフック（SNS形式のプログレスバー用）
  const { uploading, progress } = useFileUploadV2({
    category: 'document'
  })

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
    saving,
    errors,
    error,
    success
  } = useBaseForm<BasicInfoFormData>({
    initialData: formInitialData,
    tableName: 'basic_info',
    uniqueField: 'entry_id',
    validationRules: {}, // 初期ルールは空にする
    redirectPath: '', // 空文字列で自動リダイレクトを無効化
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
        const isComplete = await checkBasicInfoCompletion(formData, checkboxes, entryId)
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
          if (!value) return 'パートナーエントリー名フリガナは必須です'
          const strValue = String(value)
          if (!/^[\u30A0-\u30FF\s]+$/.test(strValue)) {
            return 'カタカナで入力してください'
          }
          return true
        }
      },
      partner_romaji: { required: true },
      partner_birthdate: { required: true },
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
          if (!strValue) return 'パートナー保護者の電話番号は必須です'
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
          if (!strValue) return 'パートナー保護者のメールアドレスは必須です'
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
    console.log('[BASIC INFO SUBMIT] === 保存ボタンクリック ===')
    console.log('[BASIC INFO SUBMIT] 一時保存モードで実行開始')
    console.log('[BASIC INFO SUBMIT] 初期entryId:', entryId)
    console.log('[BASIC INFO SUBMIT] 初期formData.entry_id:', formData.entry_id)
    
    // バリデーションはステータスチェック用のみ（保存は常に可能）

    try {
      let currentEntryId = entryId

      // エントリーが存在しない場合は作成（既存エントリーをチェック）
      if (!currentEntryId) {
        console.log('[BASIC INFO SUBMIT] === エントリー作成開始 ===')
        
        // 同一ユーザーの既存エントリーをチェック
        const { data: existingEntry, error: existingError } = await supabase
          .from('entries')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle()
        
        if (existingError && existingError.code !== 'PGRST116') {
          console.error('[BASIC INFO SUBMIT] 既存エントリーチェックエラー:', existingError)
          throw existingError
        }
        
        if (existingEntry) {
          // 既存エントリーを使用
          currentEntryId = existingEntry.id
          console.log('[BASIC INFO SUBMIT] 既存エントリーを使用:', currentEntryId)
        } else {
          // 新規エントリー作成
          console.log('[BASIC INFO SUBMIT] 新規エントリー作成')
          const { data: newEntry, error: entryError } = await supabase
            .from('entries')
            .insert({
              user_id: userId,
              participant_names: `${formData.representative_name || '未入力'}\n${formData.partner_name || '未入力'}`,
              status: 'pending',
              // 各ステータスフィールドにデフォルト値を設定
              basic_info_status: '入力中',
              preliminary_info_status: '未登録',
              semifinals_info_status: '未登録',
              finals_info_status: '未登録',
              program_info_status: '未登録',
              sns_info_status: '未登録',
              applications_info_status: '申請なし'
            })
            .select()
            .maybeSingle()

          if (entryError) {
            console.error('[BASIC INFO SUBMIT] エントリー作成エラー:', entryError)
            throw entryError
          }
          
          console.log('[BASIC INFO SUBMIT] 新規エントリー作成成功:', newEntry)
          currentEntryId = newEntry.id
        }
        
        console.log('[BASIC INFO SUBMIT] currentEntryId設定:', currentEntryId)
        
        // handleFieldChangeは非同期更新のため、直接formDataを更新
        console.log('[BASIC INFO SUBMIT] formData更新前 entry_id:', formData.entry_id)
        handleFieldChange('entry_id', currentEntryId)
        console.log('[BASIC INFO SUBMIT] handleFieldChange実行完了')
        
        // React Stateの更新を待つために少し待機
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('[BASIC INFO SUBMIT] 更新後待機完了')
        
      } else {
        console.log('[BASIC INFO SUBMIT] === 既存エントリー更新 ===')
        console.log('[BASIC INFO SUBMIT] 既存entryId:', currentEntryId)
        // participant_namesを更新
        const { error: updateError } = await supabase
          .from('entries')
          .update({
            participant_names: `${formData.representative_name || '未入力'}\n${formData.partner_name || '未入力'}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentEntryId)

        if (updateError) {
          console.error('[BASIC INFO SUBMIT] エントリー更新エラー:', updateError)
          throw updateError
        }
        console.log('[BASIC INFO SUBMIT] 既存エントリー更新完了')
      }


      // デバッグ: 保存するデータをログ出力
      console.log('=== [BASIC INFO SAVE] 保存処理開始 ===')
      console.log('[BASIC INFO SAVE] entryId:', entryId)
      console.log('[BASIC INFO SAVE] currentEntryId:', currentEntryId)
      console.log('[BASIC INFO SAVE] 最新のformData:', JSON.stringify(formData, null, 2))
      console.log('[BASIC INFO SAVE] checkboxes:', JSON.stringify(checkboxes, null, 2))
      
      // ★重要: saveFormが正しいentry_idを受け取るように、formDataを直接更新
      console.log('[BASIC INFO SAVE] === entry_id直接更新 ===')
      console.log('[BASIC INFO SAVE] 更新前のformData.entry_id:', formData.entry_id)
      
      // 直接formDataのentry_idを更新（React Stateの非同期更新問題を回避）
      const updatedFormData = {
        ...formData,
        entry_id: currentEntryId
      }
      console.log('[BASIC INFO SAVE] 直接更新後のentry_id:', updatedFormData.entry_id)
      
      const saveData = {
        ...updatedFormData,
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
      const preCheckResult = await checkBasicInfoCompletion(updatedFormData, checkboxes, currentEntryId || undefined)
      console.log('[BASIC INFO SAVE] 事前チェック結果:', preCheckResult)
      console.log('[BASIC INFO SAVE] ================================')

      console.log('[BASIC INFO SAVE] フォーム保存開始')
      
      // ★重要な修正: useBaseFormを使わずに直接保存処理を実行
      // React Stateの非同期更新問題を根本的に回避
      console.log('[BASIC INFO SAVE] === 直接保存処理実行 ===')
      
      try {
        // 空文字列をnullに変換
        const processedData = { ...updatedFormData, ...checkboxes }
        Object.keys(processedData).forEach(key => {
          const value = processedData[key as keyof typeof processedData]
          if (value === '') {
            if (key.includes('date') || key.includes('birthdate') || key.includes('_at')) {
              (processedData as Record<string, unknown>)[key] = null
            }
          }
        })
        
        // タイムスタンプ追加
        const now = new Date().toISOString()
        processedData.updated_at = now
        
        // データから不要なフィールドを除去
        const dataToSave = { ...processedData }
        if ('id' in dataToSave) {
          delete dataToSave.id
        }
        
        console.log('[BASIC INFO SAVE] 処理済み保存データ:', dataToSave)
        
        // basic_infoテーブルに既存レコードがあるかチェック
        const { data: existingBasicInfo, error: checkError } = await supabase
          .from('basic_info')
          .select('id')
          .eq('entry_id', currentEntryId)
          .single()
          
        if (checkError && checkError.code !== 'PGRST116') { // PGRST116はレコードなしエラー
          console.error('[BASIC INFO SAVE] 既存レコード確認エラー:', checkError)
          throw checkError
        }
        
        if (existingBasicInfo) {
          // 更新
          console.log('[BASIC INFO SAVE] 既存basic_info更新実行')
          const { error: updateError } = await supabase
            .from('basic_info')
            .update(dataToSave)
            .eq('entry_id', currentEntryId)
            
          if (updateError) {
            console.error('[BASIC INFO SAVE] 更新エラー:', updateError)
            throw updateError
          }
          console.log('[BASIC INFO SAVE] basic_info更新完了')
        } else {
          // 新規作成
          console.log('[BASIC INFO SAVE] 新規basic_info作成実行')
          dataToSave.created_at = now
          
          const { error: insertError } = await supabase
            .from('basic_info')
            .insert(dataToSave)
            
          if (insertError) {
            console.error('[BASIC INFO SAVE] 挿入エラー:', insertError)
            throw insertError
          }
          console.log('[BASIC INFO SAVE] basic_info作成完了')
        }
        
        // 成功処理とステータス更新
        console.log('[BASIC INFO SAVE] 保存成功')
        showToast('基本情報を保存しました', 'success')
        
        // ステータス更新処理
        console.log('[BASIC INFO SAVE] === ステータス更新処理開始 ===')
        try {
          const hasAnyData = Object.values(updatedFormData).some(value => value && value.toString().trim() !== '') || 
                           Object.values(checkboxes).some(value => value === true)
          const isComplete = await checkBasicInfoCompletion(updatedFormData, checkboxes, currentEntryId as string)
          console.log('[BASIC INFO SAVE] ステータス判定 - hasData:', hasAnyData, 'isComplete:', isComplete)
          
          await updateFormStatus('basic_info', currentEntryId as string, isComplete, hasAnyData)
          console.log('[BASIC INFO SAVE] ステータス更新完了')
        } catch (statusError) {
          console.error('[BASIC INFO SAVE] ステータス更新エラー:', statusError)
          // ステータス更新エラーは致命的ではないので続行
        }
        
      } catch (saveError) {
        console.error('[BASIC INFO SAVE] 直接保存エラー:', saveError)
        throw saveError
      }
      
      console.log('[BASIC INFO SAVE] 直接保存処理完了')

      // 保存成功後に同じページをリロード（最新データ表示のため）
      setTimeout(() => {
        window.location.reload()
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
          const isComplete = await checkBasicInfoCompletion(updatedFormData, checkboxes, entryId)
          
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

      {isEditable && <DeadlineNoticeAsync deadlineKey="basic_info_deadline" />}

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

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            基本情報の登録
          </h3>
          <p className="text-sm text-gray-600">
            ダンスジャンルとエントリーの基本情報を入力してください。
          </p>
        </div>
        <p className="text-sm text-gray-500">
          <span className="text-red-500">*</span> は必須項目です
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
          disabled={!isEditable}
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
            disabled={!isEditable}
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
              disabled={!isEditable}
              error={fieldErrors.representative_name || errors.representative_name}
            />
            <FormField
              label="エントリー名フリガナ"
              name="representative_furigana"
              value={formData.representative_furigana}
              onChange={(e) => handleFieldChangeWithValidation('representative_furigana', e.target.value)}
              required
              disabled={!isEditable}
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
              disabled={!isEditable}
              error={fieldErrors.representative_romaji || errors.representative_romaji}
            />
            <FormField
              label={`生年月日${formData.representative_birthdate ? ` (大会時点: ${calculateAge(formData.representative_birthdate)}歳)` : ''}`}
              name="representative_birthdate"
              type="date"
              value={formData.representative_birthdate || ''}
              onChange={(e) => handleFieldChangeWithValidation('representative_birthdate', e.target.value)}
              max="2025-11-23"
              min="1920-01-01"
              required
              disabled={!isEditable}
              error={fieldErrors.representative_birthdate || errors.representative_birthdate}
            />
            <FormField
              label="パートナーエントリー名"
              name="partner_name"
              value={formData.partner_name || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_name', e.target.value)}
              required
              disabled={!isEditable}
              error={fieldErrors.partner_name || errors.partner_name}
            />
            <FormField
              label="パートナーエントリー名フリガナ"
              name="partner_furigana"
              value={formData.partner_furigana || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_furigana', e.target.value)}
              required
              disabled={!isEditable}
              placeholder="カタカナで入力"
              error={fieldErrors.partner_furigana || errors.partner_furigana}
            />
            <FormField
              label="パートナーエントリー名ローマ字"
              name="partner_romaji"
              value={formData.partner_romaji || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_romaji', e.target.value)}
              placeholder="Tanaka Hanako"
              required
              disabled={!isEditable}
              error={fieldErrors.partner_romaji || errors.partner_romaji}
            />
            <FormField
              label={`パートナー生年月日${formData.partner_birthdate ? ` (大会時点: ${calculateAge(formData.partner_birthdate)}歳)` : ''}`}
              name="partner_birthdate"
              type="date"
              value={formData.partner_birthdate || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_birthdate', e.target.value)}
              max="2025-11-23"
              min="1920-01-01"
              required
              disabled={!isEditable}
              error={fieldErrors.partner_birthdate || errors.partner_birthdate}
            />
            
            <FormField
              label="代表者メールアドレス"
              name="representative_email"
              type="email"
              value={formData.representative_email}
              onChange={(e) => handleFieldChangeWithValidation('representative_email', e.target.value)}
              required
              disabled={!isEditable}
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
              disabled={!isEditable}
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

          <div className="space-y-4">
            {/* アップロード中のプログレスバー */}
            {uploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex items-center mb-2">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium text-blue-800">
                    振込確認用紙をアップロード中... {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <FileUploadField
              label="振込確認用紙 *"
              value={null}
              onChange={async (file) => {
                console.log('[BANK SLIP UPLOAD] === 振込確認用紙アップロード開始 ===')
                console.log('[BANK SLIP UPLOAD] 選択されたファイル:', file.name)
                console.log('[BANK SLIP UPLOAD] ファイルサイズ:', (file.size / 1024 / 1024).toFixed(2), 'MB')
                console.log('[BANK SLIP UPLOAD] ファイルタイプ:', file.type)
                
                if (bankSlipFile) {
                  showToast('既にファイルがアップロードされています。新しいファイルをアップロードするには、先に既存のファイルを削除してください。', 'error')
                  return
                }
                
                // ファイルアップロード前に一時保存を実行（リダイレクトなし）
                console.log('[BANK SLIP UPLOAD] === 一時保存実行開始 ===')
                let useEntryId = entryId
                
                try {
                  // エントリーが存在しない場合は作成（既存エントリーをチェック）
                  if (!useEntryId) {
                    console.log('[BANK SLIP UPLOAD] 既存エントリーチェック開始')
                    
                    // 同一ユーザーの既存エントリーをチェック
                    const { data: existingEntry, error: existingError } = await supabase
                      .from('entries')
                      .select('id')
                      .eq('user_id', userId)
                      .maybeSingle()
                    
                    if (existingError && existingError.code !== 'PGRST116') {
                      console.error('[BANK SLIP UPLOAD] 既存エントリーチェックエラー:', existingError)
                      throw existingError
                    }
                    
                    if (existingEntry) {
                      // 既存エントリーを使用
                      useEntryId = existingEntry.id
                      console.log('[BANK SLIP UPLOAD] 既存エントリーを使用:', useEntryId)
                    } else {
                      // 新規エントリー作成
                      console.log('[BANK SLIP UPLOAD] 新規エントリー作成')
                      const { data: newEntry, error: entryError } = await supabase
                        .from('entries')
                        .insert({
                          user_id: userId,
                          participant_names: `${formData.representative_name || '未入力'}\n${formData.partner_name || '未入力'}`,
                          status: 'pending',
                          // ステータスフィールドのデフォルト値を設定
                          basic_info_status: '入力中',
                          preliminary_info_status: '未登録',
                          semifinals_info_status: '未登録',
                          finals_info_status: '未登録',
                          program_info_status: '未登録',
                          sns_info_status: '未登録',
                          applications_info_status: '申請なし'
                        })
                        .select()
                        .maybeSingle()

                      if (entryError) throw entryError
                      useEntryId = newEntry.id
                      console.log('[BANK SLIP UPLOAD] 新規エントリー作成完了:', useEntryId)
                    }
                  }

                  // 基本情報を保存（空文字列をnullに変換）
                  const updatedFormData = { ...formData, ...checkboxes, entry_id: useEntryId }
                  
                  // 日付フィールドの空文字列をnullに変換
                  Object.keys(updatedFormData).forEach(key => {
                    const value = updatedFormData[key as keyof typeof updatedFormData]
                    if (value === '' && (key.includes('date') || key.includes('birthdate') || key.includes('_at'))) {
                      (updatedFormData as Record<string, unknown>)[key] = null
                    }
                  })
                  
                  console.log('[BANK SLIP UPLOAD] 基本情報保存データ（処理後）:', updatedFormData)
                  
                  const { data: existingBasicInfo, error: checkError } = await supabase
                    .from('basic_info')
                    .select('id')
                    .eq('entry_id', useEntryId)
                    .single()

                  console.log('[BANK SLIP UPLOAD] 既存データチェック:', { existingBasicInfo, checkError })

                  if (checkError && checkError.code !== 'PGRST116') {
                    console.error('[BANK SLIP UPLOAD] 既存データチェックエラー:', checkError)
                    // 406エラーの場合は無視して新規作成を試行
                    if (checkError.code !== 'PGRST406') {
                      throw checkError
                    }
                  }

                  if (existingBasicInfo) {
                    console.log('[BANK SLIP UPLOAD] 既存データ更新')
                    const { error: updateError } = await supabase.from('basic_info').update({...updatedFormData, updated_at: new Date().toISOString()}).eq('entry_id', useEntryId)
                    if (updateError) {
                      console.error('[BANK SLIP UPLOAD] 更新エラー:', updateError)
                      throw updateError
                    }
                  } else {
                    console.log('[BANK SLIP UPLOAD] 新規データ作成')
                    const insertData = { ...updatedFormData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                    console.log('[BANK SLIP UPLOAD] 挿入データ:', insertData)
                    
                    const { error: insertError } = await supabase.from('basic_info').insert(insertData)
                    if (insertError) {
                      console.error('[BANK SLIP UPLOAD] 挿入エラー:', insertError)
                      // 400エラーでも続行を試みる（ファイルアップロードは可能な場合がある）
                      console.warn('[BANK SLIP UPLOAD] basic_info保存失敗だが、ファイルアップロードは続行')
                    }
                  }
                  
                  console.log('[BANK SLIP UPLOAD] 一時保存完了、使用entryId:', useEntryId)
                } catch (tempSaveError) {
                  console.error('[BANK SLIP UPLOAD] 一時保存失敗:', tempSaveError)
                  showToast('基本情報の保存に失敗しました', 'error')
                  return
                }
                
                try {
                  // ファイルアップロード処理
                  const fileExt = file.name.split('.').pop()
                  const fileName = `${useEntryId}/bank_slip_${Date.now()}.${fileExt}`
                  
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
                    entry_id: useEntryId,
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
              maxSizeMB={20}
              required
              disabled={!!bankSlipFile || !isEditable}
              placeholder={{
                title: bankSlipFile ? "既にアップロード済みです" : "振込確認用紙をアップロード",
                formats: "JPG, PNG, GIF など（最大20MB、1件まで）"
              }}
            />

            {/* アップロード済みファイルのプレビュー（常時表示） */}
            {bankSlipFile ? (
              <div className="border rounded-lg p-3 bg-white">
                {/* プレビュー画像（常時表示） */}
                <div className="relative h-40 mb-2 bg-gray-100 rounded overflow-hidden">
                  {bankSlipFile.url ? (
                    <Image
                      src={bankSlipFile.url}
                      alt={bankSlipFile.file_name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 text-sm">プレビュー読み込み中...</p>
                    </div>
                  )}
                </div>
                
                {/* ファイル情報と操作ボタン */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{bankSlipFile.file_name}</p>
                    <p className="text-xs text-gray-500">振込確認用紙</p>
                  </div>
                  <button
                    type="button"
                    disabled={!isEditable}
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
                        
                        // 削除後にステータス更新処理を実行
                        console.log('[BANK SLIP DELETE] ステータス更新処理開始')
                        if (entryId) {
                          try {
                            const hasAnyData = Object.values(formData).some(value => value && value.toString().trim() !== '') || 
                                             Object.values(checkboxes).some(value => value === true)
                            const isComplete = await checkBasicInfoCompletion(formData, checkboxes, entryId)
                            console.log('[BANK SLIP DELETE] ステータス判定 - hasData:', hasAnyData, 'isComplete:', isComplete)
                            
                            await updateFormStatus('basic_info', entryId, isComplete, hasAnyData)
                            console.log('[BANK SLIP DELETE] ステータス更新完了')
                          } catch (statusError) {
                            console.error('[BANK SLIP DELETE] ステータス更新エラー:', statusError)
                          }
                        }
                      } catch (error) {
                        console.error('[BANK SLIP DELETE] 削除エラー:', error)
                        showToast('振込確認用紙の削除に失敗しました', 'error')
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded ${
                      !isEditable 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                    }`}
                  >
                    削除
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  振込確認用紙の追加/削除を行った場合は必ず画面下部の<span className="text-red-600">保存ボタンをクリック</span>してください。
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-600">振込確認用紙はまだアップロードされていません</p>
                <p className="text-xs text-gray-500 mt-1">上記のフォームからファイルを選択してください（1件まで）</p>
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
              label="本名"
              name="real_name"
              value={formData.real_name || ''}
              onChange={(e) => handleFieldChangeWithValidation('real_name', e.target.value)}
              placeholder="山田太郎"
              disabled={!isEditable}
              error={fieldErrors.real_name || errors.real_name}
            />
            
            <FormField
              label="本名カナ"
              name="real_name_kana"
              value={formData.real_name_kana || ''}
              onChange={(e) => handleFieldChangeWithValidation('real_name_kana', e.target.value)}
              placeholder="ヤマダタロウ"
              disabled={!isEditable}
              error={fieldErrors.real_name_kana || errors.real_name_kana}
            />
            
            <FormField
              label="パートナー本名"
              name="partner_real_name"
              value={formData.partner_real_name || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_real_name', e.target.value)}
              placeholder="田中花子"
              disabled={!isEditable}
              error={fieldErrors.partner_real_name || errors.partner_real_name}
            />
            
            <FormField
              label="パートナー本名カナ"
              name="partner_real_name_kana"
              value={formData.partner_real_name_kana || ''}
              onChange={(e) => handleFieldChangeWithValidation('partner_real_name_kana', e.target.value)}
              placeholder="タナカハナコ"
              disabled={!isEditable}
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
              disabled={!isEditable}
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
              disabled={!isEditable}
              error={fieldErrors.emergency_contact_phone_1 || errors.emergency_contact_phone_1}
            />
            
            <FormField
              label="緊急連絡先②氏名"
              name="emergency_contact_name_2"
              value={formData.emergency_contact_name_2 || ''}
              onChange={(e) => handleFieldChangeWithValidation('emergency_contact_name_2', e.target.value)}
              placeholder="山田花子"
              disabled={!isEditable}
            />
            
            <FormField
              label="緊急連絡先②電話番号"
              name="emergency_contact_phone_2"
              type="tel"
              value={formData.emergency_contact_phone_2 || ''}
              onChange={(e) => handleFieldChangeWithValidation('emergency_contact_phone_2', e.target.value)}
              placeholder="090-5678-1234"
              disabled={!isEditable}
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
                未成年選手につきましては、保護者の同伴が必要となります。<br />
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
                disabled={!isEditable}
                error={fieldErrors.guardian_name || errors.guardian_name}
              />
              
              <FormField
                label="保護者電話番号"
                name="guardian_phone"
                type="tel"
                value={formData.guardian_phone || ''}
                onChange={(e) => handleFieldChangeWithValidation('guardian_phone', e.target.value)}
                required
                disabled={!isEditable}
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
                disabled={!isEditable}
                placeholder="guardian@example.com"
                error={fieldErrors.guardian_email || errors.guardian_email}
              />
            </div>
          </div>
        )}
        
        {(formData.partner_birthdate && parseInt(calculateAge(formData.partner_birthdate)) < 18) && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              パートナー保護者情報
              <span className="text-sm text-red-500 ml-2">（18歳未満のため必須）</span>
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800">
                未成年選手につきましては、保護者の同伴が必要となります。<br />
                詳細は事務局より追ってご案内申し上げます。
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="パートナー保護者氏名"
                name="partner_guardian_name"
                value={formData.partner_guardian_name || ''}
                onChange={(e) => handleFieldChangeWithValidation('partner_guardian_name', e.target.value)}
                required
                disabled={!isEditable}
                error={fieldErrors.partner_guardian_name || errors.partner_guardian_name}
              />
              
              <FormField
                label="パートナー保護者電話番号"
                name="partner_guardian_phone"
                type="tel"
                value={formData.partner_guardian_phone || ''}
                onChange={(e) => handleFieldChangeWithValidation('partner_guardian_phone', e.target.value)}
                required
                disabled={!isEditable}
                placeholder="090-1234-5678"
                error={fieldErrors.partner_guardian_phone || errors.partner_guardian_phone}
              />
              
              <FormField
                label="パートナー保護者メールアドレス"
                name="partner_guardian_email"
                type="email"
                value={formData.partner_guardian_email || ''}
                onChange={(e) => handleFieldChangeWithValidation('partner_guardian_email', e.target.value)}
                required
                disabled={!isEditable}
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
                disabled={!isEditable}
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
                disabled={!isEditable}
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
                disabled={!isEditable}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                プライバシーポリシーに同意する <span className="text-red-500">*</span>
              </span>
            </label>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex justify-end pt-6">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !isEditable}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </form>
  )
}