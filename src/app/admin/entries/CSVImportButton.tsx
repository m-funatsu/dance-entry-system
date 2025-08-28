'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function CSVImportButton() {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイル名でテンプレート形式を判定
    if (!file.name.includes('basic_info_template')) {
      alert('テンプレートファイル名が正しくありません。\n基本情報テンプレート（basic_info_template）を使用してください。')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      console.log('読み込んだCSVテキスト:', text)
      
      // より正確なCSV解析
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
      console.log('分割された行:', lines)
      
      if (lines.length < 2) {
        alert('有効なデータが見つかりませんでした。\nヘッダー行とデータ行が必要です。')
        return
      }

      const headers = lines[0].split(',').map(cell => cell.replace(/"/g, '').trim())
      const dataRows = lines.slice(1).map(line => {
        // CSVの正確な解析（カンマ区切り、引用符処理）
        const cells = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            cells.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        cells.push(current.trim())
        
        return cells
      })
      
      console.log('ヘッダー:', headers)
      console.log('データ行:', dataRows)
      
      if (dataRows.length === 0) {
        alert('データ行が見つかりませんでした')
        return
      }

      // APIエンドポイント経由でインポート
      console.log('APIエンドポイント経由でインポート開始 - データ行数:', dataRows.length)
      
      const response = await fetch('/api/admin/csv-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData: dataRows
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        console.error('API error:', result)
        alert(`インポート処理でエラーが発生しました: ${result.error}`)
        return
      }
      
      console.log('インポート結果:', result)
      setImportResult({ success: result.success, failed: result.failed })
      
      // エラーがある場合は表示
      if (result.errors && result.errors.length > 0) {
        console.error('インポートエラー詳細:', result.errors)
        alert(`インポート完了\n成功: ${result.success}件\n失敗: ${result.failed}件\n\nエラー詳細:\n${result.errors.slice(0, 5).join('\n')}`)
      } else {
        alert(`インポート完了\n成功: ${result.success}件\n失敗: ${result.failed}件`)
      }
      
      // データを再読み込み
      router.refresh()
    } catch (error) {
      console.error('File read error:', error)
      alert('ファイルの読み込みに失敗しました')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="inline-flex items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {isImporting ? 'インポート中...' : 'CSVインポート'}
      </button>
      
      {importResult && (
        <div className="ml-4 text-sm">
          <span className="text-green-600">成功: {importResult.success}件</span>
          {importResult.failed > 0 && (
            <span className="ml-2 text-red-600">失敗: {importResult.failed}件</span>
          )}
        </div>
      )}
    </div>
  )
}