'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry } from '@/lib/types'

interface ProgramInfoFormProps {
  entryId: string | null
  initialData: Entry | null
}

export default function ProgramInfoForm({ entryId, initialData }: ProgramInfoFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    program_title: initialData?.program_title || '',
    program_subtitle: initialData?.program_subtitle || '',
    program_description: initialData?.program_description || '',
    program_duration: initialData?.program_duration || '',
    program_music_info: initialData?.program_music_info || '',
    program_choreographer_info: initialData?.program_choreographer_info || '',
    program_special_notes: initialData?.program_special_notes || ''
  })
  
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!entryId) {
      showToast('基本情報を先に保存してください', 'error')
      router.push('/dashboard/basic-info')
      return
    }

    setSaving(true)

    try {
      const dataToSave = {
        ...formData,
        program_info_submitted: true,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('entries')
        .update(dataToSave)
        .eq('id', entryId)

      if (error) throw error

      showToast('プログラム掲載用情報を保存しました', 'success')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving program info:', error)
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            ※ この情報は大会プログラムに掲載される内容です。観客に伝わりやすい表現でご記入ください。
          </p>
        </div>

        <div>
          <label htmlFor="program_title" className="block text-sm font-medium text-gray-700">
            作品タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="program_title"
            value={formData.program_title}
            onChange={(e) => setFormData({ ...formData, program_title: e.target.value })}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="例：輝く未来への舞"
          />
          <p className="mt-1 text-xs text-gray-500">
            プログラムに大きく表示されるメインタイトルです。
          </p>
        </div>

        <div>
          <label htmlFor="program_subtitle" className="block text-sm font-medium text-gray-700">
            作品サブタイトル
          </label>
          <input
            type="text"
            id="program_subtitle"
            value={formData.program_subtitle}
            onChange={(e) => setFormData({ ...formData, program_subtitle: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="例：〜希望を胸に〜"
          />
          <p className="mt-1 text-xs text-gray-500">
            タイトルを補足する副題（任意）
          </p>
        </div>

        <div>
          <label htmlFor="program_description" className="block text-sm font-medium text-gray-700">
            作品説明 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="program_description"
            value={formData.program_description}
            onChange={(e) => setFormData({ ...formData, program_description: e.target.value })}
            required
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="作品のコンセプトや見どころ、観客へのメッセージなどを100〜200文字程度でお書きください。"
          />
          <p className="mt-1 text-xs text-gray-500">
            観客が作品への理解を深められるような説明文（100〜200文字推奨）
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="program_duration" className="block text-sm font-medium text-gray-700">
              演技時間 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="program_duration"
              value={formData.program_duration}
              onChange={(e) => setFormData({ ...formData, program_duration: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例：3分30秒"
            />
          </div>

          <div>
            <label htmlFor="program_music_info" className="block text-sm font-medium text-gray-700">
              使用楽曲 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="program_music_info"
              value={formData.program_music_info}
              onChange={(e) => setFormData({ ...formData, program_music_info: e.target.value })}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例：「花」/ ORANGE RANGE"
            />
            <p className="mt-1 text-xs text-gray-500">
              「曲名」/ アーティスト名 の形式で記入
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="program_choreographer_info" className="block text-sm font-medium text-gray-700">
            振付・演出
          </label>
          <input
            type="text"
            id="program_choreographer_info"
            value={formData.program_choreographer_info}
            onChange={(e) => setFormData({ ...formData, program_choreographer_info: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="振付師名、演出担当者名など"
          />
          <p className="mt-1 text-xs text-gray-500">
            プログラムに掲載する振付・演出クレジット情報
          </p>
        </div>

        <div>
          <label htmlFor="program_special_notes" className="block text-sm font-medium text-gray-700">
            特記事項
          </label>
          <textarea
            id="program_special_notes"
            value={formData.program_special_notes}
            onChange={(e) => setFormData({ ...formData, program_special_notes: e.target.value })}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="プログラムに掲載したいその他の情報（協力者、スポンサー等）"
          />
          <p className="mt-1 text-xs text-gray-500">
            その他プログラムに掲載したい情報があれば記入（任意）
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-900 mb-2">記入例</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>作品タイトル：</strong>輝く未来への舞</p>
            <p><strong>作品説明：</strong>希望を胸に、新しい時代へと羽ばたく若者たちの姿を表現しました。力強くも繊細な動きで、観る人に勇気と感動をお届けします。</p>
            <p><strong>演技時間：</strong>3分30秒</p>
            <p><strong>使用楽曲：</strong>「花」/ ORANGE RANGE</p>
            <p><strong>振付・演出：</strong>山田太郎</p>
          </div>
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
          disabled={saving}
          className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
            saving 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}