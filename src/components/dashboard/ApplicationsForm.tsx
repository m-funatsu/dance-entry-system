'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Entry, ApplicationsInfo } from '@/lib/types'

interface ApplicationsFormProps {
  entry: Entry
}

const TICKET_PRICE = 5000 // チケット単価（円）
const COMPANION_FEE = 3000 // 同伴料（円）

export default function ApplicationsForm({ entry }: ApplicationsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('ticket')
  const [applicationsInfo, setApplicationsInfo] = useState<Partial<ApplicationsInfo>>({
    entry_id: entry.id,
    related_ticket_count: 0,
    related_ticket_total_amount: 0,
    companion_total_amount: 0
  })

  useEffect(() => {
    loadApplicationsInfo()
  }, [entry.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadApplicationsInfo = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('applications_info')
        .select('*')
        .eq('entry_id', entry.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setApplicationsInfo(data)
      }
    } catch (err) {
      console.error('各種申請情報の読み込みエラー:', err)
      setError('各種申請情報の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const calculateTicketTotal = () => {
    let count = 0
    for (let i = 1; i <= 5; i++) {
      if (applicationsInfo[`related${i}_name` as keyof ApplicationsInfo]) {
        count++
      }
    }
    const total = count * TICKET_PRICE
    setApplicationsInfo(prev => ({
      ...prev,
      related_ticket_count: count,
      related_ticket_total_amount: total
    }))
  }

  const calculateCompanionTotal = () => {
    let count = 0
    for (let i = 1; i <= 3; i++) {
      if (applicationsInfo[`companion${i}_name` as keyof ApplicationsInfo]) {
        count++
      }
    }
    const total = count * COMPANION_FEE
    setApplicationsInfo(prev => ({
      ...prev,
      companion_total_amount: total
    }))
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      // 合計金額を再計算
      calculateTicketTotal()
      calculateCompanionTotal()

      const { data: existingData } = await supabase
        .from('applications_info')
        .select('id')
        .eq('entry_id', entry.id)
        .single()

      if (existingData) {
        // 更新
        const { error } = await supabase
          .from('applications_info')
          .update({
            ...applicationsInfo,
            updated_at: new Date().toISOString()
          })
          .eq('entry_id', entry.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('applications_info')
          .insert({
            ...applicationsInfo,
            entry_id: entry.id
          })

        if (error) throw error
      }

      setSuccess('各種申請情報を保存しました')
      router.refresh()
    } catch (err) {
      console.error('保存エラー:', err)
      setError(err instanceof Error ? err.message : '各種申請情報の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${entry.id}/applications/payment_slip_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileName)

      setApplicationsInfo(prev => ({
        ...prev,
        payment_slip_path: publicUrl
      }))
      setSuccess('払込用紙をアップロードしました')
    } catch (err) {
      console.error('ファイルアップロードエラー:', err)
      setError('払込用紙のアップロードに失敗しました')
    }
  }

  if (loading) {
    return <div className="text-center p-4">読み込み中...</div>
  }

  const relationshipOptions = [
    '家族',
    '友人',
    '恩師',
    '先輩',
    '後輩',
    '関係者',
    'その他'
  ]

  const purposeOptions = [
    '付き添い',
    '撮影',
    '介助',
    'その他'
  ]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">各種申請</h3>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md">
          {success}
        </div>
      )}

      {/* タブ */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('ticket')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ticket'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            関係者チケット注文申請
          </button>
          <button
            onClick={() => setActiveTab('companion')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'companion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            選手同伴申請
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            払込用紙
          </button>
        </nav>
      </div>

      {/* 関係者チケット注文申請 */}
      {activeTab === 'ticket' && (
        <div className="space-y-6">
          <h4 className="font-medium">関係者チケット注文申請</h4>
          <p className="text-sm text-gray-600">
            関係者チケット（1枚 {TICKET_PRICE.toLocaleString()}円）を購入される方の情報を入力してください。
          </p>

          {[1, 2, 3, 4, 5].map((num) => (
            <div key={`related${num}`} className="border rounded-lg p-4 space-y-4">
              <h5 className="font-medium">関係者{num}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    関係性
                  </label>
                  <select
                    value={applicationsInfo[`related${num}_relationship` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => {
                      setApplicationsInfo(prev => ({ ...prev, [`related${num}_relationship`]: e.target.value }))
                      setTimeout(calculateTicketTotal, 0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">選択してください</option>
                    {relationshipOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名
                  </label>
                  <input
                    type="text"
                    value={applicationsInfo[`related${num}_name` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => {
                      setApplicationsInfo(prev => ({ ...prev, [`related${num}_name`]: e.target.value }))
                      setTimeout(calculateTicketTotal, 0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    フリガナ
                  </label>
                  <input
                    type="text"
                    value={applicationsInfo[`related${num}_furigana` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => setApplicationsInfo(prev => ({ ...prev, [`related${num}_furigana`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">合計人数</span>
              <span className="text-lg">{applicationsInfo.related_ticket_count || 0}人</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium">合計金額</span>
              <span className="text-lg font-bold text-blue-600">
                ¥{(applicationsInfo.related_ticket_total_amount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 選手同伴申請 */}
      {activeTab === 'companion' && (
        <div className="space-y-6">
          <h4 className="font-medium">選手同伴申請</h4>
          <p className="text-sm text-gray-600">
            選手と同伴される方の情報を入力してください。（1名につき {COMPANION_FEE.toLocaleString()}円）
          </p>

          {[1, 2, 3].map((num) => (
            <div key={`companion${num}`} className="border rounded-lg p-4 space-y-4">
              <h5 className="font-medium">同伴者{num}</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    同伴氏名
                  </label>
                  <input
                    type="text"
                    value={applicationsInfo[`companion${num}_name` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => {
                      setApplicationsInfo(prev => ({ ...prev, [`companion${num}_name`]: e.target.value }))
                      setTimeout(calculateCompanionTotal, 0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    フリガナ
                  </label>
                  <input
                    type="text"
                    value={applicationsInfo[`companion${num}_furigana` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => setApplicationsInfo(prev => ({ ...prev, [`companion${num}_furigana`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    目的
                  </label>
                  <select
                    value={applicationsInfo[`companion${num}_purpose` as keyof ApplicationsInfo] as string || ''}
                    onChange={(e) => setApplicationsInfo(prev => ({ ...prev, [`companion${num}_purpose`]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">選択してください</option>
                    {purposeOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">合計金額</span>
              <span className="text-lg font-bold text-blue-600">
                ¥{(applicationsInfo.companion_total_amount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 払込用紙 */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <h4 className="font-medium">払込用紙</h4>
          <p className="text-sm text-gray-600">
            関係者チケットまたは選手同伴申請をされた場合は、払込用紙をアップロードしてください。
          </p>

          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span>関係者チケット合計</span>
              <span>¥{(applicationsInfo.related_ticket_total_amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>選手同伴申請合計</span>
              <span>¥{(applicationsInfo.companion_total_amount || 0).toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-bold">
                <span>総合計</span>
                <span className="text-lg text-blue-600">
                  ¥{((applicationsInfo.related_ticket_total_amount || 0) + (applicationsInfo.companion_total_amount || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              払込用紙のアップロード
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {applicationsInfo.payment_slip_path && (
              <div className="mt-2 text-sm text-gray-600">
                払込用紙がアップロード済みです
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}