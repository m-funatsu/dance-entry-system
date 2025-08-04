'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useFormValidation } from './useFormValidation'
import { useErrorHandler } from './useErrorHandler'
// ValidationRulesはuseFormValidation内で定義されている

export interface UseBaseFormOptions<T extends Record<string, unknown>> {
  initialData: T
  tableName: string
  uniqueField?: string
  validationRules?: Record<string, {
    required?: boolean
    maxLength?: number
    minLength?: number
    pattern?: RegExp
    custom?: (value: unknown) => boolean | string
  }>
  redirectPath?: string
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
  validateBeforeSave?: boolean
}

export interface UseBaseFormReturn<T> {
  // フォームデータ
  formData: T
  setFormData: React.Dispatch<React.SetStateAction<T>>
  handleFieldChange: (field: keyof T, value: T[keyof T]) => void
  
  // 保存処理
  save: (isTemporary?: boolean) => Promise<boolean>
  saving: boolean
  
  // バリデーション
  errors: Record<string, string>
  validateAll: () => boolean
  validateField: (field: keyof T) => boolean
  clearErrors: () => void
  
  // 状態
  loading: boolean
  success: string | null
  error: string | null
  setSuccess: (message: string | null) => void
  setError: (error: string | null) => void
  
  // リセット
  reset: () => void
}

export function useBaseForm<T extends Record<string, unknown>>({
  initialData,
  tableName,
  uniqueField = 'id',
  validationRules = {},
  redirectPath,
  onSuccess,
  onError,
  validateBeforeSave = true
}: UseBaseFormOptions<T>): UseBaseFormReturn<T> {
  const router = useRouter()
  const supabase = createClient()
  const { handleError: handleErrorInternal } = useErrorHandler()
  
  // 状態管理
  const [formData, setFormData] = useState<T>(initialData)
  const [loading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // バリデーション
  const validation = useFormValidation(formData, validationRules)
  
  // フィールド変更ハンドラー
  const handleFieldChange = useCallback((field: keyof T, value: T[keyof T]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // フィールド変更時にエラーをクリア
    validation.validateSingleField(field as string, value)
  }, [validation])
  
  // エラー/成功メッセージの自動クリア
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])
  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000)
      return () => clearTimeout(timer)
    }
  }, [error])
  
  // 保存処理
  const save = useCallback(async (isTemporary = false): Promise<boolean> => {
    // バリデーション（一時保存時はスキップ可能）
    if (!isTemporary && validateBeforeSave) {
      const isValid = validation.validateAll(formData)
      if (!isValid) {
        setError('入力内容にエラーがあります。確認してください。')
        return false
      }
    }
    
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      // データの準備（idフィールドを除外）
      const dataToSave = { ...formData }
      if ('id' in dataToSave) {
        delete dataToSave.id
      }
      
      // タイムスタンプの追加
      const now = new Date().toISOString()
      ;(dataToSave as Record<string, unknown>).updated_at = now
      
      // 既存レコードの確認
      let existingRecord = null
      if (uniqueField in formData && formData[uniqueField]) {
        const { data: existing } = await supabase
          .from(tableName)
          .select('id')
          .eq(uniqueField, formData[uniqueField] as string)
          .single()
        
        existingRecord = existing
      }
      
      if (existingRecord) {
        // 更新
        const { error: updateError } = await supabase
          .from(tableName)
          .update(dataToSave)
          .eq(uniqueField, formData[uniqueField] as string)
        
        if (updateError) throw updateError
      } else {
        // 新規作成
        ;(dataToSave as Record<string, unknown>).created_at = now
        
        const { data: insertedData, error: insertError } = await supabase
          .from(tableName)
          .insert(dataToSave)
          .select()
          .single()
        
        if (insertError) throw insertError
        
        // 新規作成時はIDを更新
        if (insertedData && 'id' in insertedData) {
          setFormData(prev => ({ ...prev, id: insertedData.id }))
        }
      }
      
      // 成功処理
      const successMessage = isTemporary ? 'データを一時保存しました' : 'データを保存しました'
      setSuccess(successMessage)
      
      if (onSuccess) {
        onSuccess(successMessage)
      }
      
      // リダイレクト（完全保存時のみ）
      if (!isTemporary && redirectPath) {
        setTimeout(() => {
          router.push(redirectPath)
        }, 1000)
      }
      
      router.refresh()
      return true
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データの保存に失敗しました'
      
      handleErrorInternal(err, {
        fallbackMessage: errorMessage,
        logToConsole: true
      })
      
      setError(errorMessage)
      
      if (onError) {
        onError(errorMessage)
      }
      
      return false
    } finally {
      setSaving(false)
    }
  }, [formData, tableName, uniqueField, validateBeforeSave, validation, supabase, router, redirectPath, onSuccess, onError, handleErrorInternal])
  
  // バリデーションヘルパー
  const validateField = useCallback((field: keyof T): boolean => {
    validation.validateSingleField(field as string, formData[field])
    return !validation.errors[field as string]
  }, [validation, formData])
  
  const clearErrors = useCallback(() => {
    validation.clearErrors()
  }, [validation])
  
  const validateAllWrapper = useCallback(() => {
    return validation.validateAll(formData)
  }, [validation, formData])
  
  // リセット処理
  const reset = useCallback(() => {
    setFormData(initialData)
    clearErrors()
    setSuccess(null)
    setError(null)
  }, [initialData, clearErrors])
  
  return {
    // フォームデータ
    formData,
    setFormData,
    handleFieldChange,
    
    // 保存処理
    save,
    saving,
    
    // バリデーション
    errors: validation.errors,
    validateAll: validateAllWrapper,
    validateField,
    clearErrors,
    
    // 状態
    loading,
    success,
    error,
    setSuccess,
    setError,
    
    // リセット
    reset
  }
}