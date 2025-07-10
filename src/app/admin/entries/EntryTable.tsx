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
  team_name?: string
  participant_names: string
  phone_number?: string
  emergency_contact?: string
  status: string
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
}

interface EntryTableProps {
  entries: EntryWithDetails[]
  adminId: string
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

  const getFileTypeCounts = (files: { file_type: string }[]) => {
    const counts = files.reduce((acc, file) => {
      acc[file.file_type] = (acc[file.file_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      music: counts.music || 0,
      audio: counts.audio || 0,
      photo: counts.photo || 0,
      video: counts.video || 0,
    }
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

  return (
    <div className="space-y-4">
      {selectedEntries.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-indigo-800">
              {selectedEntries.length}件のエントリーが選択されています
            </span>
            <div className="flex space-x-2">
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
                ファイル
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
            {entries.map((entry) => {
              const fileCounts = getFileTypeCounts(entry.entry_files)
              return (
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
                      <div className="text-sm font-medium text-gray-900">{entry.dance_style}</div>
                      <div className="text-sm text-gray-500">
                        {entry.team_name || '個人参加'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {entry.participant_names}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        🎵 {fileCounts.music}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        🎵 {fileCounts.audio}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        📷 {fileCounts.photo}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        🎬 {fileCounts.video}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(entry.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
                  </td>
                </tr>
              )
            })}
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