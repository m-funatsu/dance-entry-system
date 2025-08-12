'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { Alert, SaveButton, CancelButton, TemporarySaveButton } from '@/components/ui'
import type { SeatRequest } from '@/lib/types'

interface SeatRequestFormProps {
  userId: string
  entryId: string | null
  initialData: SeatRequest | null
}

export default function SeatRequestForm({ userId, entryId, initialData }: SeatRequestFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    premium_seats: initialData?.premium_seats || 0,
    ss_seats: initialData?.ss_seats || 0,
    s_seats: initialData?.s_seats || 0,
    a_seats: initialData?.a_seats || 0,
    b_seats: initialData?.b_seats || 0
  })

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    const numValue = parseInt(value) || 0
    // 負の数を防ぐ
    const validValue = Math.max(0, numValue)
    setFormData(prev => ({ ...prev, [field]: validValue }))
  }

  const handleSave = async (isTemporary = false) => {
    setSaving(true)
    setError(null)

    try {
      if (!entryId) {
        // エントリーが存在しない場合は作成
        const { data: newEntry, error: entryError } = await supabase
          .from('entries')
          .insert({
            user_id: userId,
            dance_style: '',
            participant_names: '',
            status: 'pending'
          })
          .select()
          .single()

        if (entryError) throw entryError
        entryId = newEntry.id
      }

      const dataToSave = {
        entry_id: entryId,
        ...formData,
        updated_at: new Date().toISOString()
      }

      if (initialData?.id) {
        // 更新
        const { error: updateError } = await supabase
          .from('seat_request')
          .update(dataToSave)
          .eq('id', initialData.id)

        if (updateError) throw updateError
      } else {
        // 新規作成
        const { error: insertError } = await supabase
          .from('seat_request')
          .insert(dataToSave)

        if (insertError) throw insertError
      }

      showToast(
        isTemporary ? '一時保存しました' : '観覧席希望申請を登録しました',
        'success'
      )
      
      if (!isTemporary) {
        router.push('/dashboard')
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error('Save error:', error)
      setError('保存中にエラーが発生しました')
      showToast('保存に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 合計席数を計算
  const totalSeats = Object.values(formData).reduce((sum, count) => sum + count, 0)

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {error && <Alert type="error" message={error} />}

      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          観覧席種別と希望枚数
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          各席種の希望枚数を入力してください。
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="premium_seats" className="block text-sm font-medium text-gray-700 mb-1">
                プレミアム席
              </label>
              <input
                type="number"
                id="premium_seats"
                name="premium_seats"
                min="0"
                value={formData.premium_seats}
                onChange={(e) => handleFieldChange('premium_seats', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="ss_seats" className="block text-sm font-medium text-gray-700 mb-1">
                SS席
              </label>
              <input
                type="number"
                id="ss_seats"
                name="ss_seats"
                min="0"
                value={formData.ss_seats}
                onChange={(e) => handleFieldChange('ss_seats', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="s_seats" className="block text-sm font-medium text-gray-700 mb-1">
                S席
              </label>
              <input
                type="number"
                id="s_seats"
                name="s_seats"
                min="0"
                value={formData.s_seats}
                onChange={(e) => handleFieldChange('s_seats', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="a_seats" className="block text-sm font-medium text-gray-700 mb-1">
                A席
              </label>
              <input
                type="number"
                id="a_seats"
                name="a_seats"
                min="0"
                value={formData.a_seats}
                onChange={(e) => handleFieldChange('a_seats', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="b_seats" className="block text-sm font-medium text-gray-700 mb-1">
                B席
              </label>
              <input
                type="number"
                id="b_seats"
                name="b_seats"
                min="0"
                value={formData.b_seats}
                onChange={(e) => handleFieldChange('b_seats', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={saving}
              />
            </div>
          </div>

          <div className="mt-6 p-4 bg-indigo-50 rounded-md">
            <p className="text-sm font-medium text-indigo-900">
              合計希望枚数: <span className="text-lg font-bold">{totalSeats}枚</span>
            </p>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ※ご希望に添えない場合がございます。予めご了承ください。
            </p>
            <p className="text-sm text-yellow-800 mt-2">
              ※席種により料金が異なります。詳細は別途ご案内いたします。
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <CancelButton onClick={() => router.push('/dashboard')} />
        <div className="space-x-4">
          <TemporarySaveButton
            onClick={() => handleSave(true)}
            disabled={saving}
            loading={saving}
          />
          <SaveButton
            onClick={() => handleSave(false)}
            disabled={saving}
            loading={saving}
          />
        </div>
      </div>
    </form>
  )
}