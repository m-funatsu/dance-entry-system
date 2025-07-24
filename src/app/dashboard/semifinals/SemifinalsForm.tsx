'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry } from '@/lib/types'

interface SemifinalsFormProps {
  userId: string
  initialData: Entry | null
}

export default function SemifinalsForm({ initialData }: SemifinalsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    sound_semifinal: initialData?.sound_semifinal || '',
    lighting_semifinal: initialData?.lighting_semifinal || ''
  })
  
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const dataToSave = {
        sound_semifinal: formData.sound_semifinal,
        lighting_semifinal: formData.lighting_semifinal
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

      showToast('準決勝情報を保存しました', 'success')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving semifinals info:', error)
      const errorMessage = error instanceof Error ? error.message : '準決勝情報の保存に失敗しました'
      showToast(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            準決勝に進出された場合の音響・照明に関する指示をご記入ください。
          </p>
        </div>

        <div>
          <label htmlFor="sound_semifinal" className="block text-sm font-medium text-gray-700">
            音響指示書（準決勝）
          </label>
          <textarea
            id="sound_semifinal"
            value={formData.sound_semifinal}
            onChange={(e) => setFormData({ ...formData, sound_semifinal: e.target.value })}
            rows={8}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="準決勝での音響に関する要望や指示事項をご記入ください。&#10;例：&#10;- 曲の開始タイミング&#10;- 音量調整の要望&#10;- 特殊効果音の使用&#10;- その他の注意事項"
          />
          <p className="mt-1 text-xs text-gray-500">
            音響スタッフへの具体的な指示をお書きください。
          </p>
        </div>

        <div>
          <label htmlFor="lighting_semifinal" className="block text-sm font-medium text-gray-700">
            照明指示書（準決勝）
          </label>
          <textarea
            id="lighting_semifinal"
            value={formData.lighting_semifinal}
            onChange={(e) => setFormData({ ...formData, lighting_semifinal: e.target.value })}
            rows={8}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="準決勝での照明に関する要望や指示事項をご記入ください。&#10;例：&#10;- 照明の色や明るさ&#10;- スポットライトの使用&#10;- 照明転換のタイミング&#10;- その他の演出要望"
          />
          <p className="mt-1 text-xs text-gray-500">
            照明スタッフへの具体的な指示をお書きください。
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            ※ 音響・照明指示書は準決勝進出が決定してからでも追加・修正可能です。
          </p>
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
        <button
          type="submit"
          disabled={saving || !initialData}
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
            saving || !initialData
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {saving ? '保存中...' : '保存'}
        </button>
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