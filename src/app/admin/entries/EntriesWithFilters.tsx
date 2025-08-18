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

interface EntriesWithFiltersProps {
  entries: EntryWithDetails[]
}

export default function EntriesWithFilters({ entries }: EntriesWithFiltersProps) {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [formFilter, setFormFilter] = useState<string>('')


  // 特定のフォームが提出済みかチェック
  const hasSpecificForm = (entry: EntryWithDetails, formType: string) => {
    switch(formType) {
      case 'basic': return entry.basic_info && (Array.isArray(entry.basic_info) ? entry.basic_info.length > 0 : true)
      case 'preliminary': return entry.preliminary_info && entry.preliminary_info.length > 0
      case 'program': return entry.program_info && entry.program_info.length > 0
      case 'semifinals': return entry.semifinals_info && entry.semifinals_info.length > 0
      case 'finals': return entry.finals_info && entry.finals_info.length > 0
      case 'applications': return entry.applications_info && entry.applications_info.length > 0
      case 'sns': return entry.sns_info && entry.sns_info.length > 0
      default: return true
    }
  }

  // フィルタリングされたエントリーを計算
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const statusMatch = !statusFilter || entry.status === statusFilter
      
      let entryGenre = ''
      if (entry.basic_info) {
        if (Array.isArray(entry.basic_info) && entry.basic_info.length > 0) {
          entryGenre = entry.basic_info[0]?.dance_style || entry.dance_style || ''
        } else if (!Array.isArray(entry.basic_info)) {
          entryGenre = entry.basic_info.dance_style || entry.dance_style || ''
        }
      } else {
        entryGenre = entry.dance_style || ''
      }
      
      const genreMatch = !genreFilter || entryGenre === genreFilter
      const formMatch = !formFilter || (
        formFilter === 'has_' ? hasSpecificForm(entry, formFilter.replace('has_', '')) :
        formFilter === 'no_' ? !hasSpecificForm(entry, formFilter.replace('no_', '')) :
        formFilter.startsWith('has_') ? hasSpecificForm(entry, formFilter.replace('has_', '')) :
        formFilter.startsWith('no_') ? !hasSpecificForm(entry, formFilter.replace('no_', '')) :
        true
      )
      return statusMatch && genreMatch && formMatch
    })
  }, [entries, statusFilter, genreFilter, formFilter])

  // 利用可能なダンスジャンルを取得
  const availableGenres = useMemo(() => {
    const genres = [...new Set(entries.map(entry => {
      if (entry.basic_info) {
        if (Array.isArray(entry.basic_info) && entry.basic_info.length > 0) {
          return entry.basic_info[0]?.dance_style || entry.dance_style || ''
        } else if (!Array.isArray(entry.basic_info)) {
          return entry.basic_info.dance_style || entry.dance_style || ''
        }
      }
      return entry.dance_style || ''
    }).filter(genre => genre))]
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
            <div className="flex space-x-2">
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
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
            >
              <option value="">全フォーム</option>
              <optgroup label="提出済み">
                <option value="has_basic">基本情報あり</option>
                <option value="has_preliminary">予選情報あり</option>
                <option value="has_program">プログラム情報あり</option>
                <option value="has_semifinals">準決勝情報あり</option>
                <option value="has_finals">決勝情報あり</option>
                <option value="has_applications">申請情報あり</option>
                <option value="has_sns">SNS情報あり</option>
              </optgroup>
              <optgroup label="未提出">
                <option value="no_basic">基本情報なし</option>
                <option value="no_preliminary">予選情報なし</option>
                <option value="no_program">プログラム情報なし</option>
                <option value="no_semifinals">準決勝情報なし</option>
                <option value="no_finals">決勝情報なし</option>
                <option value="no_applications">申請情報なし</option>
                <option value="no_sns">SNS情報なし</option>
              </optgroup>
            </select>
            <select 
              className="rounded-md border-gray-300 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全ステータス</option>
              <option value="pending">未処理</option>
              <option value="selected">予選通過</option>
              <option value="rejected">予選敗退</option>
            </select>
            {(statusFilter || genreFilter || formFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('')
                  setGenreFilter('')
                  setFormFilter('')
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                フィルタをクリア
              </button>
            )}
            </div>
            <CSVExportButton entries={filteredEntries} />
            <CSVImportButton />
          </div>
        </div>
        
        <EntryTable entries={filteredEntries} />
      </div>
    </div>
  )
}