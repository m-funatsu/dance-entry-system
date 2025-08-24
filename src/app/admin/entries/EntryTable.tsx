'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EmailComposer from '@/components/EmailComposer'

interface EntryWithDetails {
  id: string
  user_id: string
  dance_style: string
  participant_names: string
  status: 'pending' | 'submitted' | 'selected' | 'rejected'
  basic_info_status?: string
  preliminary_info_status?: string
  semifinals_info_status?: string
  finals_info_status?: string
  program_info_status?: string
  sns_info_status?: string
  applications_info_status?: string
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
  }[] | { 
    id: string
    dance_style?: string
    category_division?: string
  }
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
  const [localEntries, setLocalEntries] = useState<EntryWithDetails[]>(entries)
  const router = useRouter()
  
  // props entriesが変更されたら内部状態を更新
  useEffect(() => {
    setLocalEntries(entries)
  }, [entries])

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
            予選通過
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            予選敗退
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
    // 各フォームの判定ロジック（配列・単一オブジェクト両方に対応）
    const hasBasicInfo = entry.basic_info && (Array.isArray(entry.basic_info) ? entry.basic_info.length > 0 : !!entry.basic_info)
    const hasPreliminaryInfo = entry.preliminary_info && (Array.isArray(entry.preliminary_info) ? entry.preliminary_info.length > 0 : !!entry.preliminary_info)
    const hasProgramInfo = entry.program_info && (Array.isArray(entry.program_info) ? entry.program_info.length > 0 : !!entry.program_info)
    const hasSemifinalsInfo = entry.semifinals_info && (Array.isArray(entry.semifinals_info) ? entry.semifinals_info.length > 0 : !!entry.semifinals_info)
    const hasFinalsInfo = entry.finals_info && (Array.isArray(entry.finals_info) ? entry.finals_info.length > 0 : !!entry.finals_info)
    const hasApplicationsInfo = entry.applications_info && (Array.isArray(entry.applications_info) ? entry.applications_info.length > 0 : !!entry.applications_info)
    const hasSnsInfo = entry.sns_info && (Array.isArray(entry.sns_info) ? entry.sns_info.length > 0 : !!entry.sns_info)

    // デバッグログ（問題解決後は削除）
    const debugInfo = {
      judgments: {
        basic: hasBasicInfo,
        preliminary: hasPreliminaryInfo,
        program: hasProgramInfo,
        semifinals: hasSemifinalsInfo,
        finals: hasFinalsInfo,
        applications: hasApplicationsInfo,
        sns: hasSnsInfo
      },
      dataStructure: {
        basic_info: {
          exists: !!entry.basic_info,
          isArray: Array.isArray(entry.basic_info),
          length: Array.isArray(entry.basic_info) ? entry.basic_info.length : 'not array',
          data: entry.basic_info
        },
        preliminary_info: {
          exists: !!entry.preliminary_info,
          isArray: Array.isArray(entry.preliminary_info),
          length: Array.isArray(entry.preliminary_info) ? entry.preliminary_info.length : 'not array',
          data: entry.preliminary_info
        },
        program_info: {
          exists: !!entry.program_info,
          isArray: Array.isArray(entry.program_info),
          length: Array.isArray(entry.program_info) ? entry.program_info.length : 'not array',
          data: entry.program_info
        },
        semifinals_info: {
          exists: !!entry.semifinals_info,
          isArray: Array.isArray(entry.semifinals_info),
          length: Array.isArray(entry.semifinals_info) ? entry.semifinals_info.length : 'not array',
          data: entry.semifinals_info
        },
        finals_info: {
          exists: !!entry.finals_info,
          isArray: Array.isArray(entry.finals_info),
          length: Array.isArray(entry.finals_info) ? entry.finals_info.length : 'not array',
          data: entry.finals_info
        },
        applications_info: {
          exists: !!entry.applications_info,
          isArray: Array.isArray(entry.applications_info),
          length: Array.isArray(entry.applications_info) ? entry.applications_info.length : 'not array',
          data: entry.applications_info
        },
        sns_info: {
          exists: !!entry.sns_info,
          isArray: Array.isArray(entry.sns_info),
          length: Array.isArray(entry.sns_info) ? entry.sns_info.length : 'not array',
          data: entry.sns_info
        }
      }
    }
    
    console.log(`Entry ${entry.id} 提出状況詳細:`)
    console.log(JSON.stringify(debugInfo, null, 2))

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
    if (!localEntries || localEntries.length === 0) return
    
    if (selectedEntries.length === localEntries.length) {
      setSelectedEntries([])
    } else {
      setSelectedEntries(localEntries.map(entry => entry.id))
    }
  }


  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedEntries.length === 0) {
      alert('エントリーを選択してください')
      return
    }

    const statusText = newStatus === 'selected' ? '予選通過' : newStatus === 'rejected' ? '予選敗退' : newStatus
    if (!confirm(`選択したエントリーのステータスを「${statusText}」に変更しますか？`)) {
      return
    }

    setLoading(true)
    const originalEntries = [...localEntries]

    try {
      // 楽観的更新: 先に画面を更新
      setLocalEntries(prev => 
        prev.map(entry => 
          selectedEntries.includes(entry.id)
            ? { ...entry, status: newStatus as 'pending' | 'submitted' | 'selected' | 'rejected' }
            : entry
        )
      )

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
        // エラーの場合は元に戻す
        setLocalEntries(originalEntries)
        const errorData = await response.json()
        alert(errorData.error || 'ステータスの更新に失敗しました')
        return
      }

      setSelectedEntries([])
      
      // 成功時は最新データで更新
      setTimeout(() => {
        router.refresh()
      }, 1000)
    } catch (error) {
      // エラーの場合は元に戻す
      setLocalEntries(originalEntries)
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
                onClick={() => bulkUpdateStatus('selected')}
                disabled={loading}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                予選通過に変更
              </button>
              <button
                onClick={() => bulkUpdateStatus('rejected')}
                disabled={loading}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
              >
                予選敗退に変更
              </button>
              <button
                onClick={() => setShowEmailComposer(true)}
                disabled={loading}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                メール送信
              </button>
              <button
                onClick={async () => {
                  const selectedUsersWithEmails = localEntries
                    .filter(entry => selectedEntries.includes(entry.id))
                    .map(entry => ({ email: entry.users.email, name: entry.users.name }))
                  
                  // 送信前の確認ポップアップ
                  const confirmed = confirm(
                    `選択された ${selectedUsersWithEmails.length} 件のエントリーにウェルカムメールを送信します。\n\n` +
                    `送信先:\n${selectedUsersWithEmails.map(user => `• ${user.name} (${user.email})`).join('\n')}\n\n` +
                    `この操作は取り消せません。送信してもよろしいですか？`
                  )
                  
                  if (!confirmed) {
                    return
                  }
                  
                  setLoading(true)
                  try {
                    for (const user of selectedUsersWithEmails) {
                      const response = await fetch('/api/admin/send-welcome-email', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: user.email, name: user.name }),
                      })
                      
                      if (!response.ok) {
                        const errorData = await response.json()
                        throw new Error(errorData.error || 'ウェルカムメールの送信に失敗しました')
                      }
                    }
                    alert(`✅ ${selectedUsersWithEmails.length}件のウェルカムメールを送信しました`)
                  } catch (error) {
                    console.error('Bulk welcome email error:', error)
                    alert('❌ ウェルカムメールの送信に失敗しました')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading || selectedEntries.length === 0}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                ウェルカムメール
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
                🗑️ 削除
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
                  checked={localEntries?.length > 0 && selectedEntries.length === localEntries.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                エントリー名
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ダンスジャンル
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                代表者メールアドレス
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                提出ステータス
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                選考ステータス
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                参加同意書
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                詳細
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {localEntries?.length > 0 && localEntries.map((entry) => (
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
                    <div className="text-sm font-medium text-gray-900">{entry.users?.name || '不明なユーザー'}</div>
                    <div className="text-sm text-gray-900 mt-1">
                      {entry.participant_names || 'エントリー名なし'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(() => {
                        if (entry.basic_info) {
                          if (Array.isArray(entry.basic_info) && entry.basic_info.length > 0) {
                            return entry.basic_info[0]?.dance_style || '未入力'
                          } else if (!Array.isArray(entry.basic_info)) {
                            return entry.basic_info.dance_style || '未入力'
                          }
                        }
                        return '未入力'
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{entry.users?.email || 'メールアドレス不明'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getSubmissionBadge(entry)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(entry.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs space-y-1">
                      {(() => {
                        // basic_infoから同意状況を取得
                        let basicInfo = null
                        if (entry.basic_info) {
                          if (Array.isArray(entry.basic_info) && entry.basic_info.length > 0) {
                            basicInfo = entry.basic_info[0]
                          } else if (!Array.isArray(entry.basic_info)) {
                            basicInfo = entry.basic_info
                          }
                        }
                        
                        const agreements = {
                          agreement: (basicInfo as Record<string, unknown>)?.agreement_checked,
                          privacy: (basicInfo as Record<string, unknown>)?.privacy_policy_checked,
                          media: (basicInfo as Record<string, unknown>)?.media_consent_checked
                        }
                        
                        return (
                          <div className="space-y-1">
                            <div className={`flex items-center ${agreements.agreement ? 'text-green-600' : 'text-red-600'}`}>
                              <span className="mr-1">{agreements.agreement ? '✓' : '✗'}</span>
                              <span>規約同意</span>
                            </div>
                            <div className={`flex items-center ${agreements.privacy ? 'text-green-600' : 'text-red-600'}`}>
                              <span className="mr-1">{agreements.privacy ? '✓' : '✗'}</span>
                              <span>個人情報</span>
                            </div>
                            <div className={`flex items-center ${agreements.media ? 'text-green-600' : 'text-red-600'}`}>
                              <span className="mr-1">{agreements.media ? '✓' : '✗'}</span>
                              <span>メディア</span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/entries/${entry.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>

      {localEntries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-sm text-gray-500">エントリーがありません</div>
        </div>
      )}

      {showEmailComposer && (
        <EmailComposer
          selectedEntries={selectedEntries}
          entries={localEntries}
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