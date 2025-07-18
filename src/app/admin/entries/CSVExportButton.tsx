'use client'

import { useState } from 'react'
import { entriesToCSV, downloadCSV, EntryWithUser } from '@/lib/csv'

interface CSVExportButtonProps {
  entries: EntryWithUser[]
}

export default function CSVExportButton({ entries }: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csv = entriesToCSV(entries)
      const now = new Date()
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      const filename = `entries_${timestamp}.csv`
      
      downloadCSV(csv, filename)
    } catch (error) {
      console.error('CSV export error:', error)
      alert('CSVエクスポート中にエラーが発生しました')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || entries.length === 0}
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg
        className="mr-2 h-5 w-5 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        />
      </svg>
      {isExporting ? 'エクスポート中...' : 'CSVエクスポート'}
    </button>
  )
}