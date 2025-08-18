'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useErrorHandler } from './useErrorHandler'
import type { BaseFormData } from '@/lib/types'

interface UseFormSaveOptions {
  tableName: string
  uniqueField?: string // entry_id or user_id
  redirectPath?: string
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
}

export const useFormSave = ({
  tableName,
  uniqueField = 'entry_id',
  redirectPath = '/dashboard',
  onSuccess,
  onError
}: UseFormSaveOptions) => {
  const router = useRouter()
  const supabase = createClient()
  const { handleError: handleErrorInternal } = useErrorHandler()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const save = async <T extends BaseFormData>(data: T) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Check if record exists
      const { data: existingData } = await supabase
        .from(tableName)
        .select('id')
        .eq(uniqueField, data[uniqueField])
        .maybeSingle()

      if (existingData) {
        // Update existing record
        const updateData = { ...data }
        delete updateData.id // Remove id from update data
        
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq(uniqueField, data[uniqueField])

        if (updateError) {
          console.error('UPDATE エラー詳細 (useFormSave):')
          console.error('  code:', updateError.code)
          console.error('  message:', updateError.message)
          console.error('  details:', updateError.details)
          console.error('  hint:', updateError.hint)
          console.error('テーブル名:', tableName)
          console.error('送信データ:', JSON.stringify(updateData, null, 2))
          throw updateError
        }
      } else {
        // Insert new record
        const insertData = { ...data }
        delete insertData.id // Remove id from insert data
        
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(insertData)

        if (insertError) {
          console.error('INSERT エラー詳細 (useFormSave):')
          console.error('  code:', insertError.code)
          console.error('  message:', insertError.message)
          console.error('  details:', insertError.details)
          console.error('  hint:', insertError.hint)
          console.error('テーブル名:', tableName)
          console.error('送信データ:', JSON.stringify(insertData, null, 2))
          throw insertError
        }
      }

      const successMessage = 'データを保存しました'
      setSuccess(successMessage)
      
      if (onSuccess) {
        onSuccess(successMessage)
      }

      // 常にダッシュボードにリダイレクト
      if (redirectPath) {
        setTimeout(() => {
          router.push(redirectPath)
        }, 1500)
      }
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
    } finally {
      setSaving(false)
    }
  }

  return {
    save,
    saving,
    error,
    success,
    setError,
    setSuccess
  }
}