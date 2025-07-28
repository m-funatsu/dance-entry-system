'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry } from '@/lib/types'

interface SNSFormProps {
  userId: string
  initialData: Entry | null
}

export default function SNSForm({ initialData }: SNSFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    instagram: initialData?.instagram || '',
    twitter: initialData?.twitter || '',
    facebook: initialData?.facebook || ''
  })
  
  const [saving, setSaving] = useState(false)
  const [savingMode, setSavingMode] = useState<'save' | 'submit'>('save')

  const handleSubmit = async (e: React.FormEvent, mode: 'save' | 'submit' = 'submit') => {
    e.preventDefault()
    setSaving(true)
    setSavingMode(mode)

    try {
      const dataToSave = {
        instagram: formData.instagram,
        twitter: formData.twitter,
        facebook: formData.facebook
      }

      if (initialData) {
        // 更新
        const { error } = await supabase
          .from('entries')
          .update({
            ...dataToSave,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData.id)

        if (error) throw error
      } else {
        showToast('基本情報を先に保存してください', 'error')
        router.push('/dashboard/basic-info')
        return
      }

      showToast(
        mode === 'submit' 
          ? 'SNS情報を保存しました' 
          : 'SNS情報を一時保存しました', 
        'success'
      )
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving SNS info:', error)
      const errorMessage = error instanceof Error ? error.message : 'SNS情報の保存に失敗しました'
      showToast(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          SNSアカウントをお持ちの場合は、以下にユーザー名またはURLを入力してください。
        </p>

        <div>
          <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
            Instagram
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">@</span>
            </div>
            <input
              type="text"
              id="instagram"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              className="pl-8 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="username"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            ユーザー名のみ（@は不要）またはプロフィールURL
          </p>
        </div>

        <div>
          <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
            X (Twitter)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">@</span>
            </div>
            <input
              type="text"
              id="twitter"
              value={formData.twitter}
              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
              className="pl-8 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="username"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            ユーザー名のみ（@は不要）またはプロフィールURL
          </p>
        </div>

        <div>
          <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
            Facebook
          </label>
          <input
            type="text"
            id="facebook"
            value={formData.facebook}
            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="プロフィールURL"
          />
          <p className="mt-1 text-xs text-gray-500">
            FacebookページまたはプロフィールのURL
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-sm text-blue-800">
          ※ SNS情報は任意です。入力いただいた情報は、イベントの告知や結果発表時に使用させていただく場合があります。
        </p>
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
            disabled={saving || !initialData}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium ${
              saving || !initialData
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {saving && savingMode === 'save' ? '一時保存中...' : '一時保存'}
          </button>
          <button
            type="submit"
            disabled={saving || !initialData}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
              saving || !initialData
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saving && savingMode === 'submit' ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {!initialData && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            基本情報を先に保存してください。
          </p>
        </div>
      )}
    </form>
  )
}