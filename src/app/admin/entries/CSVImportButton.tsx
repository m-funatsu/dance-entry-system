'use client'

import { useState, useRef } from 'react'
import { parseCSV } from '@/lib/csv'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CSVImportButton() {
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const entries = parseCSV(text)
      
      if (entries.length === 0) {
        alert('有効なデータが見つかりませんでした')
        return
      }

      const supabase = createClient()
      let successCount = 0
      let failedCount = 0

      // 現在のユーザーを取得（インポートしたエントリーに紐付けるため）
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('ログインが必要です')
        return
      }

      // バッチでインポート
      for (const entry of entries) {
        try {
          // IDが存在する場合は更新、存在しない場合は新規作成
          if (entry.id) {
            // 既存エントリーの更新
            const { error } = await supabase
              .from('entries')
              .update(entry)
              .eq('id', entry.id)
            
            if (error) {
              console.error('Update error:', error)
              failedCount++
            } else {
              successCount++
            }
          } else {
            // 新規エントリーの作成
            const { error } = await supabase
              .from('entries')
              .insert({
                ...entry,
                user_id: user.id,
                status: entry.status || 'pending',
                created_at: new Date().toISOString()
              })
            
            if (error) {
              console.error('Insert error:', error)
              failedCount++
            } else {
              successCount++
            }
          }
        } catch (error) {
          console.error('Import error:', error)
          failedCount++
        }
      }

      setImportResult({ success: successCount, failed: failedCount })
      
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