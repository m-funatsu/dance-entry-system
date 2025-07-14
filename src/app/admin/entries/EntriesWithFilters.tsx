'use client'

import { useState, useMemo } from 'react'
import EntryTable from './EntryTable'

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

interface EntriesWithFiltersProps {
  entries: EntryWithDetails[]
  adminId: string
}

export default function EntriesWithFilters({ entries, adminId }: EntriesWithFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [genreFilter, setGenreFilter] = useState<string>('')

  // フィルタリングされたエントリーを計算
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const statusMatch = !statusFilter || entry.status === statusFilter
      const genreMatch = !genreFilter || entry.dance_style === genreFilter
      return statusMatch && genreMatch
    })
  }, [entries, statusFilter, genreFilter])

  // 利用可能なダンスジャンルを取得
  const availableGenres = useMemo(() => {
    const genres = [...new Set(entries.map(entry => entry.dance_style))]
    return genres.sort()
  }, [entries])

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            全エントリー ({filteredEntries.length}件 / {entries.length}件)
          </h2>
          <div className="flex space-x-2">
            <select 
              className="rounded-md border-gray-300 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全ステータス</option>
              <option value="pending">未処理</option>
              <option value="submitted">提出済み</option>
              <option value="selected">選考通過</option>
              <option value="rejected">不選考</option>
            </select>
            <select 
              className="rounded-md border-gray-300 text-sm"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
            >
              <option value="">全ジャンル</option>
              {availableGenres.map(genre => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            {(statusFilter || genreFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('')
                  setGenreFilter('')
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                フィルタをクリア
              </button>
            )}
          </div>
        </div>
        
        <EntryTable entries={filteredEntries} adminId={adminId} />
      </div>
    </div>
  )
}