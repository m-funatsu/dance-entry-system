'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EmailComposer } from '@/components/EmailComposer'
import AdminLink from '@/components/admin/AdminLink'
// status-utils のimportは削除（現在未使用のため）
import { getStatusLabel, getStatusColor } from '@/lib/status-labels'

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
  consent_form_submitted?: boolean
  created_at: string
  updated_at: string
  users: {
    name: string
    email: string
  }
  entry_files: {
    id: string
    file_type: string
    purpose?: string
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
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {getStatusLabel(status)}
      </span>
    )
  }

  const getSubmissionBadge = (entry: EntryWithDetails) => {
    // データベースのステータスカラムを使用（新しいアプローチ）
    
    // 申請情報は特別ロジック（申請あり/なしのみ）
    const hasApplicationsInfo = !!entry.applications_info && (
      Array.isArray(entry.applications_info) 
        ? entry.applications_info.length > 0 
        : !!entry.applications_info
    )
    
    // 参加同意書の状況を確認（consent_form_submittedで判定）
    const hasConsentForm = !!(entry.consent_form_submitted)
    
    // ステータスカラムの値から色を決定する関数
    const getStatusColorFromValue = (status: string | undefined) => {
      switch (status) {
        case '登録済み': return 'bg-green-100 text-green-800'
        case '入力中': return 'bg-yellow-100 text-yellow-800'
        case '未登録': 
        default: return 'bg-gray-100 text-gray-400'
      }
    }

    return (
      <div className="flex flex-wrap gap-1">
        {/* 基本：登録済み=緑、入力中=黄色、未登録=グレー */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColorFromValue(entry.basic_info_status)}`}>
          基本
        </span>
        
        {/* 予選：登録済み=緑、入力中=黄色、未登録=グレー */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColorFromValue(entry.preliminary_info_status)}`}>
          予選
        </span>
        
        {/* プログラム：登録済み=緑、入力中=黄色、未登録=グレー */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColorFromValue(entry.program_info_status)}`}>
          プログラム
        </span>
        
        {/* 準決勝：登録済み=緑、入力中=黄色、未登録=グレー */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColorFromValue(entry.semifinals_info_status)}`}>
          準決勝
        </span>
        
        {/* 決勝：登録済み=緑、入力中=黄色、未登録=グレー */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColorFromValue(entry.finals_info_status)}`}>
          決勝
        </span>
        
        {/* 申請：申請あり=緑、申請なし=グレー */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          hasApplicationsInfo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
        }`}>
          申請
        </span>
        
        {/* SNS：登録済み=緑、入力中=黄色、未登録=グレー */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColorFromValue(entry.sns_info_status)}`}>
          SNS
        </span>
        
        {/* 同意書：提出済み=緑、未提出=グレー */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          hasConsentForm ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
        }`}>
          同意書
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

    const statusText = newStatus === 'selected' ? '予選通過' : newStatus === 'rejected' ? '予選敗退' : newStatus === 'pending' ? '未処理' : newStatus
    if (!confirm(`選択したエントリーのステータスを「${statusText}」に変更しますか？`)) {
      return
    }

    console.log('🔄 [STATUS UPDATE] ステータス更新開始:', {
      selectedEntries,
      newStatus,
      entryCount: selectedEntries.length
    })

    setLoading(true)
    const originalEntries = [...localEntries]

    try {
      // 楽観的更新: 先に画面を更新
      console.log('📝 [STATUS UPDATE] 楽観的更新実行中...')
      setLocalEntries(prev => 
        prev.map(entry => 
          selectedEntries.includes(entry.id)
            ? { ...entry, status: newStatus as 'pending' | 'submitted' | 'selected' | 'rejected' }
            : entry
        )
      )

      // ダミーエントリー（dummy-で始まるID）を除外
      const realEntryIds = selectedEntries.filter(id => !id.startsWith('dummy-'))
      
      console.log('🔍 [STATUS UPDATE] エントリーIDフィルタリング:', {
        originalSelected: selectedEntries,
        filteredReal: realEntryIds,
        dummyIds: selectedEntries.filter(id => id.startsWith('dummy-')),
        realCount: realEntryIds.length,
        dummyCount: selectedEntries.length - realEntryIds.length
      })

      if (realEntryIds.length === 0) {
        console.warn('⚠️ [STATUS UPDATE] 実際のエントリーが選択されていません（ダミーエントリーのみ）')
        alert('ダミーエントリー（ログインのみのユーザー）のステータスは変更できません')
        setLocalEntries(originalEntries)
        return
      }

      console.log('🌐 [STATUS UPDATE] API呼び出し開始:', {
        url: '/api/admin/entries/status',
        method: 'PUT',
        payload: {
          entryIds: realEntryIds,
          status: newStatus,
        }
      })

      const response = await fetch('/api/admin/entries/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryIds: realEntryIds,
          status: newStatus,
        }),
      })

      console.log('📡 [STATUS UPDATE] APIレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      })

      if (!response.ok) {
        // エラーの場合は元に戻す
        console.error('❌ [STATUS UPDATE] APIエラー - レスポンス詳細:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        })

        let errorData: Record<string, unknown> = {}
        try {
          errorData = await response.json()
          console.error('❌ [STATUS UPDATE] エラー詳細:', errorData)
        } catch (jsonError) {
          console.error('❌ [STATUS UPDATE] レスポンスJSONパース失敗:', jsonError)
          
          // テキストとして読み取りを試行
          try {
            const textResponse = await response.text()
            console.error('❌ [STATUS UPDATE] レスポンステキスト:', textResponse)
          } catch (textError) {
            console.error('❌ [STATUS UPDATE] レスポンステキスト読み取り失敗:', textError)
          }
        }

        setLocalEntries(originalEntries)
        const errorMessage = errorData.error || errorData.message || `HTTP Error ${response.status}: ${response.statusText}`
        console.error('❌ [STATUS UPDATE] 最終エラーメッセージ:', errorMessage)
        alert(`Failed to update entry status: ${errorMessage}`)
        return
      }

      console.log('✅ [STATUS UPDATE] 成功 - レスポンス処理中...')
      
      try {
        const successData = await response.json()
        console.log('✅ [STATUS UPDATE] 成功データ:', successData)
      } catch (jsonError) {
        console.warn('⚠️ [STATUS UPDATE] 成功レスポンスJSONパース失敗（成功は維持）:', jsonError)
      }

      setSelectedEntries([])
      console.log('🔄 [STATUS UPDATE] ページリロード予約（1秒後）')
      
      // 成功時はページをリロード
      setTimeout(() => {
        console.log('🔄 [STATUS UPDATE] ページリロード実行')
        window.location.reload()
      }, 1000)
    } catch (error) {
      // エラーの場合は元に戻す
      setLocalEntries(originalEntries)
      console.error('💥 [STATUS UPDATE] 予期しないエラー:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      alert(`ステータスの更新に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      console.log('🏁 [STATUS UPDATE] 処理完了 - ローディング状態解除')
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
      // ダミーエントリーと実エントリーを分別
      const realEntryIds = selectedEntries.filter(id => !id.startsWith('dummy-'))
      const dummyEntryIds = selectedEntries.filter(id => id.startsWith('dummy-'))
      
      console.log('🗑️ [BULK DELETE] 削除対象分析:', {
        total: selectedEntries.length,
        realEntries: realEntryIds.length,
        dummyEntries: dummyEntryIds.length,
        realIds: realEntryIds,
        dummyIds: dummyEntryIds
      })

      let totalDeleted = 0
      const errors: string[] = []

      // 1. 実エントリーの削除
      if (realEntryIds.length > 0) {
        console.log('🗑️ [BULK DELETE] 実エントリー削除開始')
        
        const entryResponse = await fetch('/api/admin/entries/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entryIds: realEntryIds,
          }),
        })

        if (!entryResponse.ok) {
          const errorData = await entryResponse.json()
          console.error('❌ [BULK DELETE] 実エントリー削除エラー:', errorData)
          errors.push(`実エントリー削除失敗: ${errorData.error}`)
        } else {
          const result = await entryResponse.json()
          console.log('✅ [BULK DELETE] 実エントリー削除成功:', result)
          totalDeleted += result.deletedCount || realEntryIds.length
        }
      }

      // 2. ダミーエントリー（ユーザー）の削除
      if (dummyEntryIds.length > 0) {
        console.log('🗑️ [BULK DELETE] ダミーエントリー（ユーザー）削除開始')
        
        // ダミーIDからuser_idを抽出
        const userIdsToDelete = dummyEntryIds.map(id => id.replace('dummy-', ''))
        
        const userResponse = await fetch('/api/admin/entries/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entryIds: [], // 空の配列
            userIds: userIdsToDelete // ユーザーIDを追加
          }),
        })

        if (!userResponse.ok) {
          const errorData = await userResponse.json()
          console.error('❌ [BULK DELETE] ユーザー削除エラー:', errorData)
          errors.push(`ユーザー削除失敗: ${errorData.error}`)
        } else {
          const userResult = await userResponse.json()
          console.log('✅ [BULK DELETE] ユーザー削除成功:', userResult)
          totalDeleted += dummyEntryIds.length
        }
      }

      // 結果表示
      if (errors.length > 0) {
        alert(`削除処理完了（一部エラー）:\n✅ 削除成功: ${totalDeleted}件\n❌ エラー:\n${errors.join('\n')}`)
      } else {
        alert(`${totalDeleted}件を削除しました`)
      }

      setSelectedEntries([])
      window.location.reload()
      
    } catch (error) {
      console.error('💥 [BULK DELETE] 予期しないエラー:', error)
      alert(`削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
                onClick={() => bulkUpdateStatus('pending')}
                disabled={loading}
                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50 cursor-pointer"
              >
                未処理に変更
              </button>
              <button
                onClick={() => bulkUpdateStatus('selected')}
                disabled={loading}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                予選通過に変更
              </button>
              <button
                onClick={() => bulkUpdateStatus('rejected')}
                disabled={loading}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                予選敗退に変更
              </button>
              <button
                onClick={() => setShowEmailComposer(true)}
                disabled={loading}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
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
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
              >
                ウェルカムメール
              </button>
            </div>
          </div>
          {/* 危険操作エリア */}
          <div className="mt-3 pt-3 border-t border-indigo-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700 font-semibold">
                ⚠️ 危険操作: 削除したデータは復元できません
              </span>
              <button
                onClick={bulkDeleteEntries}
                disabled={loading}
                className="px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-800 disabled:opacity-50 border border-red-600 font-medium cursor-pointer"
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <AdminLink
                      href={`/admin/entries/${entry.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      詳細
                    </AdminLink>
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
          selectedEntriesData={localEntries.filter(entry => selectedEntries.includes(entry.id))}
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