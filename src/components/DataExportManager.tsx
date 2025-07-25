'use client'

import { useState } from 'react'

interface DataExportManagerProps {
  totalEntries: number
  totalFiles: number
}

export default function DataExportManager({ totalEntries, totalFiles }: DataExportManagerProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<string>('')

  // 内部関数：状態管理を外部で行う版
  const performDataExport = async (format: 'json' | 'csv' | 'zip' = 'csv') => {
    const response = await fetch(`/api/admin/export/data?format=${format}`)
    
    if (!response.ok) {
      throw new Error('データエクスポートに失敗しました')
    }

    if (format === 'csv' || format === 'zip') {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      if (format === 'zip') {
        a.download = `dance_entry_data_tables_${timestamp}.zip`
      } else {
        a.download = `dance_entry_data_${timestamp}.csv`
      }
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } else {
      const data = await response.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dance_entry_data_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  }

  const handleExportData = async (format: 'json' | 'csv' | 'zip' = 'csv') => {
    setIsExporting(true)
    setExportStatus('データベースデータをエクスポート中...')

    try {
      await performDataExport(format)
      setExportStatus('データエクスポートが完了しました')
    } catch (error) {
      console.error('Export error:', error)
      setExportStatus('エクスポートに失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'))
    } finally {
      setIsExporting(false)
    }
  }

  // 内部関数：状態管理を外部で行う版
  const performFileExport = async () => {
    const response = await fetch('/api/admin/export/files')
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'ファイルエクスポートに失敗しました')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    // レスポンスヘッダーからファイル名を取得
    const contentDisposition = response.headers.get('content-disposition')
    let filename = `dance_entry_files_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.zip`
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }
    
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleExportFiles = async () => {
    if (totalFiles === 0) {
      alert('エクスポートするファイルがありません')
      return
    }

    if (!confirm(`${totalFiles}個のファイルをZIPアーカイブでダウンロードしますか？\n\n注意: ファイル数が多い場合、処理に時間がかかる場合があります。`)) {
      return
    }

    setIsExporting(true)
    setExportStatus('ファイルアーカイブを作成中...')

    try {
      await performFileExport()
      setExportStatus('ファイルエクスポートが完了しました')
    } catch (error) {
      console.error('File export error:', error)
      setExportStatus('ファイルエクスポートに失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'))
    } finally {
      setIsExporting(false)
    }
  }

  const handleFullExport = async () => {
    if (!confirm('全データ（データベース + ファイル）をエクスポートしますか？\n\n1. テーブル別ZIPファイル\n2. ファイルアーカイブZIP\n\nの順でダウンロードが開始されます。')) {
      return
    }

    setIsExporting(true)
    
    try {
      // Step 1: テーブル別ZIPデータエクスポート
      setExportStatus('ステップ1/2: データベースデータをエクスポート中...')
      await performDataExport('zip')
      
      // Step 2: ファイルアーカイブエクスポート
      if (totalFiles > 0) {
        setExportStatus('ステップ2/2: ファイルアーカイブをエクスポート中...')
        // 少し間を空けてファイルエクスポート
        await new Promise(resolve => setTimeout(resolve, 1500))
        await performFileExport()
      } else {
        setExportStatus('データベースデータのエクスポートが完了しました（ファイルはありません）')
      }
      
      setExportStatus('完全エクスポートが完了しました！')
    } catch (error) {
      console.error('Full export error:', error)
      setExportStatus('完全エクスポートに失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'))
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
              参加者情報、エントリー詳細、選考結果などのデータをエクスポートします。<br/>
              <strong>📁 テーブル別ZIP</strong>: 各テーブル（users.csv, entries.csv等）を個別ファイルでZIP化（推奨）
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExportData('zip')}
                disabled={isExporting}
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📁 テーブル別ZIP（推奨）
              </button>
              <button
                onClick={() => handleExportData('csv')}
                disabled={isExporting}
                className="px-3 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-md text-sm hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📄 統合CSV
              </button>
              <button
                onClick={() => handleExportData('json')}
                disabled={isExporting}
                className="px-3 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📋 JSON形式
              </button>
            </div>
          </div>

          {/* ファイルアーカイブエクスポート */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">ファイルアーカイブのエクスポート</h4>
            <p className="text-sm text-gray-500 mb-3">
              音楽、動画、写真ファイルをZIP形式でまとめてダウンロードします。
            </p>
            <button
              onClick={handleExportFiles}
              disabled={isExporting || totalFiles === 0}
              className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {totalFiles === 0 ? 'ファイルがありません' : 'ZIPアーカイブをダウンロード'}
            </button>
          </div>

          {/* 完全エクスポート */}
          <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-900 mb-2">完全エクスポート（推奨）</h4>
            <p className="text-sm text-purple-700 mb-3">
              データベースデータとファイルアーカイブの両方を連続してダウンロードします。
            </p>
            <button
              onClick={handleFullExport}
              disabled={isExporting}
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              すべてをエクスポート
            </button>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p className="mb-2">📝 <strong>エクスポートされるデータ:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>テーブル別ZIP</strong>: users.csv, entries.csv, entry_files.csv, selections.csv, settings.csv（各テーブル個別ファイル + README）</li>
            <li><strong>統合CSV</strong>: 全テーブルが1つのファイルに結合（従来形式）</li>
            <li><strong>ファイルアーカイブ</strong>: 音楽、動画、写真等をフォルダ分類してZIP化</li>
          </ul>
          <p className="mt-3">
            💡 <strong>推奨:</strong> テーブル別ZIPは各データを個別に分析でき、次回システムでの再利用にも適しています。
          </p>
        </div>
      </div>
    </div>
  )
}