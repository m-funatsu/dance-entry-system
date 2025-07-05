'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatDateLocale } from '@/lib/utils'
import FileList from '@/components/FileList'

interface EntryDetailProps {
  entry: {
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
      file_path: string
      file_name: string
      file_size: number
      created_at: string
    }[]
    selections?: {
      id: string
      status: string
      score?: number
      comments?: string
      created_at: string
      users?: {
        name: string
      }
    }[]
  }
  adminId: string
}

export default function EntryDetail({ entry, adminId }: EntryDetailProps) {
  const [score, setScore] = useState(entry.selections?.[0]?.score || '')
  const [comments, setComments] = useState(entry.selections?.[0]?.comments || '')
  const [status, setStatus] = useState(entry.selections?.[0]?.status || 'pending')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            審査待ち
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

  const handleSaveSelection = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()

      if (entry.selections && entry.selections.length > 0) {
        const { error } = await supabase
          .from('selections')
          .update({
            score: score ? parseInt(String(score)) : null,
            comments,
            status,
          })
          .eq('id', entry.selections[0].id)

        if (error) {
          setMessage('選考結果の更新に失敗しました')
          return
        }
      } else {
        const { error } = await supabase
          .from('selections')
          .insert([
            {
              entry_id: entry.id,
              admin_id: adminId,
              score: score ? parseInt(String(score)) : null,
              comments,
              status,
            }
          ])

        if (error) {
          setMessage('選考結果の作成に失敗しました')
          return
        }
      }

      const { error: entryError } = await supabase
        .from('entries')
        .update({ status })
        .eq('id', entry.id)

      if (entryError) {
        setMessage('エントリーステータスの更新に失敗しました')
        return
      }

      setMessage('選考結果を保存しました')
      router.refresh()
    } catch {
      setMessage('選考結果の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            参加者情報
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">参加者名</dt>
              <dd className="mt-1 text-sm text-gray-900">{entry.users.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
              <dd className="mt-1 text-sm text-gray-900">{entry.users.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ダンスジャンル</dt>
              <dd className="mt-1 text-sm text-gray-900">{entry.dance_style}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">チーム名</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {entry.team_name || '個人参加'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">電話番号</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {entry.phone_number || '未入力'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">緊急連絡先</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {entry.emergency_contact || '未入力'}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">参加者詳細</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {entry.participant_names}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">エントリー日時</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDateLocale(entry.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">現在のステータス</dt>
              <dd className="mt-1">{getStatusBadge(entry.status)}</dd>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            アップロードファイル
          </h2>
          {entry.entry_files && entry.entry_files.length > 0 ? (
            <FileList entryId={entry.id} editable={false} />
          ) : (
            <p className="text-gray-500">アップロードされたファイルはありません</p>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            選考評価
          </h2>
          
          {message && (
            <div className={`mb-4 p-4 rounded-md ${
              message.includes('失敗') 
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSaveSelection} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  選考結果 *
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="pending">審査待ち</option>
                  <option value="selected">選考通過</option>
                  <option value="rejected">不選考</option>
                </select>
              </div>

              <div>
                <label htmlFor="score" className="block text-sm font-medium text-gray-700">
                  スコア（1-10）
                </label>
                <input
                  type="number"
                  id="score"
                  min="1"
                  max="10"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="1-10の数値"
                />
              </div>
            </div>

            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
                コメント・フィードバック
              </label>
              <textarea
                id="comments"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="選考に関するコメントやフィードバックを入力"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/admin/entries')}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                戻る
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? '保存中...' : '選考結果を保存'}
              </button>
            </div>
          </form>

          {entry.selections && entry.selections.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">評価履歴</h3>
              <div className="text-sm text-gray-500">
                <p>評価者: {entry.selections[0].users?.name}</p>
                <p>評価日時: {formatDateLocale(entry.selections[0].created_at)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}