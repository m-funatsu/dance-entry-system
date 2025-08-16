'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DataExportManagerProps {
  totalEntries: number
  totalFiles: number
}

export default function DataExportManager({ totalEntries, totalFiles }: DataExportManagerProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<string>('')

  // オブジェクトをフラット化する関数
  const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, string | number | boolean> => {
    const flattened: Record<string, string | number | boolean> = {}
    
    for (const key in obj) {
      if (obj[key] === null || obj[key] === undefined) {
        flattened[prefix + key] = ''
      } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        Object.assign(flattened, flattenObject(obj[key] as Record<string, unknown>, prefix + key + '_'))
      } else if (Array.isArray(obj[key])) {
        flattened[prefix + key] = JSON.stringify(obj[key])
      } else {
        flattened[prefix + key] = obj[key] as string | number | boolean
      }
    }
    
    return flattened
  }

  // CSVエクスポート関数
  const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      setExportStatus('エクスポートするデータがありません')
      return
    }

    // フラットなオブジェクトに変換
    const flattenedData = data.map(item => flattenObject(item))
    
    // CSVヘッダーを作成
    const headers = Object.keys(flattenedData[0])
    const csvHeaders = headers.join(',')
    
    // CSVデータを作成
    const csvData = flattenedData.map(row => {
      return headers.map(header => {
        const value = row[header]
        // 値にカンマ、改行、ダブルクォートが含まれる場合は適切にエスケープ
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    }).join('\n')
    
    const csv = `${csvHeaders}\n${csvData}`
    
    // BOMを追加（Excel対応）
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8' })
    
    // ダウンロード
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // JSONエクスポート関数
  const exportToJSON = (data: Record<string, unknown>[], filename: string) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportData = async (format: 'json' | 'csv' = 'csv') => {
    setIsExporting(true)
    setExportStatus('データベースデータをエクスポート中...')

    try {
      const supabase = createClient()
      
      // エントリーと関連データを取得
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select(`
          *,
          users(name, email),
          basic_info(*),
          preliminary_info(*),
          semifinals_info(*),
          finals_info(*),
          applications_info(*),
          program_info(*),
          sns_info(*),
          seat_request(*)
        `)
        .order('created_at', { ascending: false })
      
      if (entriesError) throw entriesError
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      const filename = format === 'csv' 
        ? `dance_entry_data_${timestamp}.csv`
        : `dance_entry_data_${timestamp}.json`
      
      if (format === 'csv') {
        exportToCSV(entries || [], filename)
      } else {
        exportToJSON(entries || [], filename)
      }
      
      setExportStatus('データエクスポートが完了しました')
    } catch (error) {
      console.error('Export error:', error)
      setExportStatus('エクスポートに失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'))
    } finally {
      setIsExporting(false)
    }
  }


  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          データエクスポート
        </h3>
        
        {exportStatus && (
          <div className={`mb-4 p-4 rounded-md ${
            exportStatus.includes('失敗') || exportStatus.includes('エラー')
              ? 'bg-red-50 border border-red-200 text-red-800'
              : exportStatus.includes('完了')
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {exportStatus.includes('中...') && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{exportStatus}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">データベースデータ</h4>
                <p className="text-sm text-gray-500">{totalEntries}件のエントリー</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">アップロードファイル</h4>
                <p className="text-sm text-gray-500">{totalFiles}個のファイル</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* データベースデータエクスポート */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">データベースデータのエクスポート</h4>
            <p className="text-sm text-gray-500 mb-3">
              参加者情報、エントリー詳細、選考結果などの全データをエクスポートします。
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExportData('csv')}
                disabled={isExporting}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📄 CSVでダウンロード
              </button>
              <button
                onClick={() => handleExportData('json')}
                disabled={isExporting}
                className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📋 JSON形式でダウンロード
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p className="mb-2">📝 <strong>エクスポートされるデータ:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>CSV形式</strong>: エントリー情報、基本情報、予選・準決勝・決勝情報、申請情報など全データを1つのCSVファイルに結合</li>
            <li><strong>JSON形式</strong>: 構造化されたデータとして出力（プログラムでの処理に適しています）</li>
          </ul>
          <p className="mt-3">
            💡 <strong>推奨:</strong> CSVファイルはExcelで開くことができ、データの分析や集計に便利です。
          </p>
        </div>
      </div>
    </div>
  )
}