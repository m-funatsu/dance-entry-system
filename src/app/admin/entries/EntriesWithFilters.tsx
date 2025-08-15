'use client'

import { useState, useMemo } from 'react'
import EntryTable from './EntryTable'
import CSVExportButton from './CSVExportButton'
import CSVImportButton from './CSVImportButton'

interface EntryWithDetails {
  id: string
  user_id: string
  dance_style: string
  team_name?: string
  participant_names: string
  phone_number?: string
  emergency_contact?: string
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
  basic_info?: { id: string }[]
  preliminary_info?: { id: string }[]
  program_info?: { id: string }[]
  semifinals_info?: { id: string }[]
  finals_info?: { id: string }[]
  applications_info?: { id: string }[]
  sns_info?: { id: string }[]
}

interface EntriesWithFiltersProps {
  entries: EntryWithDetails[]
}

export default function EntriesWithFilters({ entries }: EntriesWithFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [submissionFilter, setSubmissionFilter] = useState<string>('')

  // 各エントリーの提出状況を計算
  const getSubmissionStatus = (entry: EntryWithDetails) => {
    const hasBasicInfo = entry.basic_info && entry.basic_info.length > 0
    const hasPreliminaryInfo = entry.preliminary_info && entry.preliminary_info.length > 0
    const hasProgramInfo = entry.program_info && entry.program_info.length > 0
    const hasSemifinalsInfo = entry.semifinals_info && entry.semifinals_info.length > 0
    const hasFinalsInfo = entry.finals_info && entry.finals_info.length > 0
    const hasApplicationsInfo = entry.applications_info && entry.applications_info.length > 0
    const hasSnsInfo = entry.sns_info && entry.sns_info.length > 0

    const statuses = {
      basic: hasBasicInfo,
      preliminary: hasPreliminaryInfo,
      program: hasProgramInfo,
      semifinals: hasSemifinalsInfo,
      finals: hasFinalsInfo,
      applications: hasApplicationsInfo,
      sns: hasSnsInfo
    }

    const completedCount = Object.values(statuses).filter(Boolean).length
    const totalCount = 7 // 全フォーム数

    if (completedCount === 0) return 'not_started'
    if (completedCount === totalCount) return 'completed'
    return 'in_progress'
  }

  // フィルタリングされたエントリーを計算
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const statusMatch = !statusFilter || entry.status === statusFilter
      const genreMatch = !genreFilter || entry.dance_style === genreFilter
      const submissionMatch = !submissionFilter || getSubmissionStatus(entry) === submissionFilter
      return statusMatch && genreMatch && submissionMatch
    })
  }, [entries, statusFilter, genreFilter, submissionFilter])

  // 利用可能なダンスジャンルを取得
  const availableGenres = useMemo(() => {
    const genres = [...new Set(entries.map(entry => entry.dance_style))]
    return genres.sort()
  }, [entries])

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            全エントリー ({filteredEntries.length}件 / {entries.length}件)
          </h2>
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <CSVExportButton entries={filteredEntries} />
            <CSVImportButton />
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
            <select 
              className="rounded-md border-gray-300 text-sm"
              value={submissionFilter}
              onChange={(e) => setSubmissionFilter(e.target.value)}
            >
              <option value="">全提出状況</option>
              <option value="not_started">未開始</option>
              <option value="in_progress">途中</option>
              <option value="completed">完了</option>
            </select>
            {(statusFilter || genreFilter || submissionFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('')
                  setGenreFilter('')
                  setSubmissionFilter('')
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                フィルタをクリア
              </button>
            )}
            </div>
          </div>
        </div>
        
        <EntryTable entries={filteredEntries} getSubmissionStatus={getSubmissionStatus} />
      </div>
    </div>
  )
}