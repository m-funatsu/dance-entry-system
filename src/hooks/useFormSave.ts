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

  const save = async <T extends BaseFormData>(data: T, isTemporary = false) => {
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

        if (updateError) throw updateError
      } else {
        // Insert new record
        const insertData = { ...data }
        delete insertData.id // Remove id from insert data
        
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(insertData)

        if (insertError) throw insertError
      }

      const successMessage = isTemporary ? 'データを一時保存しました' : 'データを保存しました'
      setSuccess(successMessage)
      
      if (onSuccess) {
        onSuccess(successMessage)
      }

      if (!isTemporary && redirectPath) {
        router.push(redirectPath)
      } else {
        // router.refresh()を削除して再レンダリングを防ぐ
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