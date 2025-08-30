'use client'

import { useState, useMemo } from 'react'
import EntryTable from './EntryTable'
import CSVImportButton from './CSVImportButton'
import CSVTemplateButton from '@/components/admin/CSVTemplateButton'
import AdminLink from '@/components/admin/AdminLink'

interface EntryWithDetails {
  id: string
  user_id: string
  dance_style: string
  team_name?: string
  participant_names: string
  emergency_contact?: string
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

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('[ENTRIES FILTER DEBUG] エントリー総数:', entries.length)
    const allStatusValues = new Set()
    entries.forEach(entry => {
      if (entry.basic_info_status) allStatusValues.add(`basic_info: ${entry.basic_info_status}`)
      if (entry.preliminary_info_status) allStatusValues.add(`preliminary_info: ${entry.preliminary_info_status}`)
      if (entry.program_info_status) allStatusValues.add(`program_info: ${entry.program_info_status}`)
      if (entry.semifinals_info_status) allStatusValues.add(`semifinals_info: ${entry.semifinals_info_status}`)
      if (entry.finals_info_status) allStatusValues.add(`finals_info: ${entry.finals_info_status}`)
      if (entry.sns_info_status) allStatusValues.add(`sns_info: ${entry.sns_info_status}`)
      if (entry.applications_info_status) allStatusValues.add(`applications_info: ${entry.applications_info_status}`)
    })
    console.log('[ENTRIES FILTER DEBUG] 発見されたステータス値:', Array.from(allStatusValues))
  }

  // DBのステータスフィールドを使用してフォーム提出状況をチェック
  const hasSpecificForm = (entry: EntryWithDetails, formType: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[FILTER DEBUG] ${formType} チェック:`, {
        entryId: entry.id,
        [`${formType}_status`]: entry[`${formType}_info_status` as keyof EntryWithDetails] || entry.consent_form_submitted
      })
    }
    
    switch(formType) {
      case 'basic': return entry.basic_info_status === '登録済み'
      case 'preliminary': return entry.preliminary_info_status === '登録済み'
      case 'program': return entry.program_info_status === '登録済み'
      case 'semifinals': return entry.semifinals_info_status === '登録済み'
      case 'finals': return entry.finals_info_status === '登録済み'
      case 'applications': return entry.applications_info_status === '申請あり'
      case 'sns': return entry.sns_info_status === '登録済み'
      case 'consent': return entry.consent_form_submitted === true
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
          entryGenre = entry.basic_info[0]?.dance_style || ''
        } else if (!Array.isArray(entry.basic_info)) {
          entryGenre = entry.basic_info.dance_style || ''
        }
      }
      
      const genreMatch = !genreFilter || entryGenre === genreFilter
      const formMatch = !formFilter || (
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
          return entry.basic_info[0]?.dance_style || ''
        } else if (!Array.isArray(entry.basic_info)) {
          return entry.basic_info.dance_style || ''
        }
      }
      return ''
    }).filter(genre => genre))]
    return genres.sort()
  }, [entries])

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* カテゴリー別情報一覧へのナビゲーション */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-900">カテゴリー別情報一覧</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <AdminLink
              href="/admin/entries/basic"
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-md text-center transition-colors"
            >
              基本情報
            </AdminLink>
            <AdminLink
              href="/admin/entries/preliminary"
              className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded-md text-center transition-colors"
            >
              予選情報
            </AdminLink>
            <AdminLink
              href="/admin/entries/program"
              className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded-md text-center transition-colors"
            >
              プログラム
            </AdminLink>
            <AdminLink
              href="/admin/entries/semifinals"
              className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-2 rounded-md text-center transition-colors"
            >
              準決勝
            </AdminLink>
            <AdminLink
              href="/admin/entries/finals"
              className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-center transition-colors"
            >
              決勝情報
            </AdminLink>
            <AdminLink
              href="/admin/entries/sns"
              className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-800 px-3 py-2 rounded-md text-center transition-colors"
            >
              SNS情報
            </AdminLink>
            <AdminLink
              href="/admin/entries/applications"
              className="text-xs bg-pink-100 hover:bg-pink-200 text-pink-800 px-3 py-2 rounded-md text-center transition-colors"
            >
              各種申請
            </AdminLink>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            全エントリー ({filteredEntries.length}件 / {entries.length}件)
          </h2>
          <div className="flex items-center space-x-4 flex-wrap gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-gray-700">ジャンル</label>
              <select 
                className="rounded-md border-gray-300 text-sm cursor-pointer"
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
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-gray-700">提出ステータス</label>
              <select 
                className="rounded-md border-gray-300 text-sm cursor-pointer"
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
                  <option value="has_consent">参加同意書あり</option>
                </optgroup>
                <optgroup label="未提出">
                  <option value="no_basic">基本情報なし</option>
                  <option value="no_preliminary">予選情報なし</option>
                  <option value="no_program">プログラム情報なし</option>
                  <option value="no_semifinals">準決勝情報なし</option>
                  <option value="no_finals">決勝情報なし</option>
                  <option value="no_applications">申請情報なし</option>
                  <option value="no_sns">SNS情報なし</option>
                  <option value="no_consent">参加同意書なし</option>
                </optgroup>
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-gray-700">選考ステータス</label>
              <select 
                className="rounded-md border-gray-300 text-sm cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">全ステータス</option>
                <option value="pending">選考前</option>
                <option value="selected">予選通過</option>
                <option value="rejected">予選敗退</option>
              </select>
            </div>
            {(statusFilter || genreFilter || formFilter) && (
              <button
                onClick={() => {
                  setStatusFilter('')
                  setGenreFilter('')
                  setFormFilter('')
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                フィルタをクリア
              </button>
            )}
            <div className="flex space-x-2">
              <CSVTemplateButton templateType="basic" />
              <CSVImportButton />
            </div>
          </div>
        </div>
        
        <EntryTable entries={filteredEntries} />
      </div>
    </div>
  )
}