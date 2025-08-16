'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDateLocale } from '@/lib/utils'
import EmailComposer from '@/components/EmailComposer'

interface EntryWithDetails {
  id: string
  user_id: string
  dance_style: string
  participant_names: string
  phone_number?: string
  status: 'pending' | 'submitted' | 'selected' | 'rejected'
  created_at: string
  updated_at: string
  users: {
    name: string
    email: string
  }
  entry_files: {
    id: string
    file_type: string
  }[]
  selections?: {
    id: string
    status: string
    score?: number
    created_at: string
  }[]
  basic_info?: { 
    id: string
    dance_style?: string
    category_division?: string
  }[]
  preliminary_info?: { id: string }[]
  program_info?: { id: string }[]
  semifinals_info?: { id: string }[]
  finals_info?: { id: string }[]
  applications_info?: { id: string }[]
  sns_info?: { id: string }[]
}

interface EntryTableProps {
  entries: EntryWithDetails[]
}

export default function EntryTable({ entries }: EntryTableProps) {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            未処理
          </span>
        )
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            提出済み
          </span>
        )
      case 'selected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            選考通過
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            不選考
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            未設定
          </span>
        )
    }
  }

  const getSubmissionBadge = (entry: EntryWithDetails) => {
    const hasBasicInfo = entry.basic_info && entry.basic_info.length > 0
    const hasPreliminaryInfo = entry.preliminary_info && entry.preliminary_info.length > 0
    const hasProgramInfo = entry.program_info && entry.program_info.length > 0
    const hasSemifinalsInfo = entry.semifinals_info && entry.semifinals_info.length > 0
    const hasFinalsInfo = entry.finals_info && entry.finals_info.length > 0
    const hasApplicationsInfo = entry.applications_info && entry.applications_info.length > 0
    const hasSnsInfo = entry.sns_info && entry.sns_info.length > 0

    return (
      <div className="flex flex-wrap gap-1">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          hasBasicInfo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
        }`}>
          基本
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          hasPreliminaryInfo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
        }`}>
          予選
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          hasProgramInfo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
        }`}>
          プログラム
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          hasSemifinalsInfo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
        }`}>
          準決勝
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          hasFinalsInfo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
        }`}>
          決勝
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          hasApplicationsInfo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
        }`}>
          申請
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          hasSnsInfo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
        }`}>
          SNS
        </span>
      </div>
    )
  }


  const handleSelectEntry = (entryId: string) => {
    setSelectedEntries(prev => {
      if (prev.includes(entryId)) {
        return prev.filter(id => id !== entryId)
      } else {
        return [...prev, entryId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedEntries.length === entries.length) {
      setSelectedEntries([])
    } else {
      setSelectedEntries(entries.map(entry => entry.id))
    }
  }

  const sendWelcomeEmail = async (email: string, name: string) => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'ウェルカムメールの送信に失敗しました')
        return
      }

      alert(data.message || 'ウェルカムメールを送信しました')
    } catch (error) {
      console.error('Welcome email error:', error)
      alert('ウェルカムメールの送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateEntryStatus = async (entryId: string, newStatus: string) => {
    setLoading(true)

    try {
      const response = await fetch('/api/admin/entries/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryIds: [entryId],
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'ステータスの更新に失敗しました')
        return
      }

      router.refresh()
    } catch (error) {
      console.error('Status update error:', error)
      alert('ステータスの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedEntries.length === 0) {
      alert('エントリーを選択してください')
      return
    }

    if (!confirm(`選択したエントリーのステータスを「${newStatus}」に変更しますか？`)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/entries/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryIds: selectedEntries,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'ステータスの更新に失敗しました')
        return
      }

      setSelectedEntries([])
      router.refresh()
    } catch (error) {
      console.error('Bulk status update error:', error)
      alert('ステータスの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const bulkDeleteEntries = async () => {
    if (selectedEntries.length === 0) {
      alert('削除するエントリーを選択してください')
      return
    }

    const confirmMessage = `選択した${selectedEntries.length}件のエントリーを完全に削除しますか？\n\n⚠️ 注意: この操作は取り消せません。\n- エントリーデータ\n- 関連するファイル\n- 選考結果\n\nすべてが削除されます。`
    
    if (!confirm(confirmMessage)) {
      return
    }

    // 二重確認
    if (!confirm('本当に削除しますか？この操作は取り消せません。')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/entries/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryIds: selectedEntries,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.error || 'エントリーの削除に失敗しました')
        return
      }

      const result = await response.json()
      const message = `${result.deletedCount}件のエントリーを削除しました\n\n📁 ファイル削除: ${result.filesDeletionSummary.details}`
      alert(message)
      setSelectedEntries([])
      router.refresh()
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert('エントリーの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {selectedEntries.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-800">
              {selectedEntries.length}件のエントリーが選択されています
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => bulkUpdateStatus('submitted')}
                disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                提出済みに変更
              </button>
              <button
                onClick={() => bulkUpdateStatus('selected')}
                disabled={loading}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                選考通過に変更
              </button>
              <button
                onClick={() => bulkUpdateStatus('rejected')}
                disabled={loading}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
              >
                不選考に変更
              </button>
              <button
                onClick={() => setShowEmailComposer(true)}
                disabled={loading}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                メール送信
              </button>
            </div>
          </div>
          {/* 危険操作エリア */}
          <div className="mt-3 pt-3 border-t border-indigo-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-red-600 font-medium">
                ⚠️ 危険操作: 削除したデータは復元できません
              </span>
              <button
                onClick={bulkDeleteEntries}
                disabled={loading}
                className="px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-800 disabled:opacity-50 border border-red-600 font-medium"
              >
                🗑️ 選択されたエントリーを削除
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="relative px-6 py-3">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={selectedEntries.length === entries.length && entries.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                参加者情報
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ダンス情報
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                提出状況
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
                <tr key={entry.id} className={selectedEntries.includes(entry.id) ? 'bg-indigo-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedEntries.includes(entry.id)}
                      onChange={() => handleSelectEntry(entry.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{entry.users?.name || '不明なユーザー'}</div>
                      <div className="text-sm text-gray-500">{entry.users?.email || 'メールアドレス不明'}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDateLocale(entry.created_at)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {entry.basic_info?.[0]?.dance_style || entry.dance_style || 'ジャンル未設定'}
                      </div>
                      {entry.basic_info?.[0]?.category_division && (
                        <div className="text-xs text-gray-600">
                          {entry.basic_info[0].category_division}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {entry.participant_names}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getSubmissionBadge(entry)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(entry.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/entries/${entry.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          詳細
                        </Link>
                        <select
                          value={entry.status}
                          onChange={(e) => updateEntryStatus(entry.id, e.target.value)}
                          disabled={loading}
                          className="rounded border-gray-300 text-xs disabled:opacity-50"
                        >
                          <option value="pending">未処理</option>
                          <option value="submitted">提出済み</option>
                          <option value="selected">選考通過</option>
                          <option value="rejected">不選考</option>
                        </select>
                      </div>
                      {entry.status === 'pending' && (
                        <button
                          onClick={() => sendWelcomeEmail(entry.users.email, entry.users.name)}
                          disabled={loading}
                          className="text-xs text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                        >
                          ウェルカムメールを送信
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-sm text-gray-500">エントリーがありません</div>
        </div>
      )}

      {showEmailComposer && (
        <EmailComposer
          selectedEntries={selectedEntries}
          entries={entries}
          onClose={() => setShowEmailComposer(false)}
          onSent={() => {
            setSelectedEntries([])
            router.refresh()
          }}
        />
      )}
    </div>
  )
}