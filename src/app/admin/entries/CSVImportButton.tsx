'use client'

import { useState, useRef } from 'react'
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

    // ファイル名でテンプレート形式を判定
    if (!file.name.includes('basic_info_template')) {
      alert('テンプレートファイル名が正しくありません。\n基本情報テンプレート（basic_info_template）を使用してください。')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const rows = text.split('\n').map(row => row.split(',').map(cell => cell.replace(/"/g, '').trim()))
      
      if (rows.length < 2) {
        alert('有効なデータが見つかりませんでした。\nヘッダー行とデータ行が必要です。')
        return
      }

      const dataRows = rows.slice(1).filter(row => row.some(cell => cell.length > 0))
      
      if (dataRows.length === 0) {
        alert('データ行が見つかりませんでした')
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

      // 基本情報テンプレート（7項目）の処理
      console.log('処理開始 - データ行数:', dataRows.length)
      
      for (let i = 0; i < dataRows.length; i++) {
        const rowData = dataRows[i]
        console.log(`行${i + 1}を処理中:`, rowData)
        
        try {
          const [danceStyle, representativeName, representativeFurigana, representativeEmail, phoneNumber, partnerName, partnerFurigana] = rowData
          
          console.log('抽出データ:', {
            danceStyle,
            representativeName,
            representativeFurigana,
            representativeEmail,
            phoneNumber,
            partnerName,
            partnerFurigana
          })
          
          if (!representativeEmail || !representativeName) {
            console.error('必須項目が不足:', { representativeEmail, representativeName })
            alert(`行${i + 1}: 代表者メールと代表者名は必須です`)
            failedCount++
            continue
          }
          
          // 簡単なバリデーション
          if (!representativeEmail.includes('@')) {
            console.error('無効なメールアドレス:', representativeEmail)
            alert(`行${i + 1}: 無効なメールアドレス形式です`)
            failedCount++
            continue
          }
          
          // 基本情報のみを作成（簡素化）
          console.log('基本情報作成中...')
          const { error: basicInfoError } = await supabase
            .from('basic_info')
            .insert({
              dance_style: danceStyle || '',
              representative_name: representativeName,
              representative_furigana: representativeFurigana || '',
              representative_email: representativeEmail,
              phone_number: phoneNumber || '',
              partner_name: partnerName || '',
              partner_furigana: partnerFurigana || ''
            })
          
          if (basicInfoError) {
            console.error('基本情報作成エラー:', basicInfoError)
            alert(`行${i + 1}: 基本情報の作成に失敗しました - ${basicInfoError.message}`)
            failedCount++
          } else {
            console.log(`行${i + 1}: 成功`)
            successCount++
          }
        } catch (error) {
          console.error(`行${i + 1}でエラー:`, error)
          alert(`行${i + 1}: 処理中にエラーが発生しました`)
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