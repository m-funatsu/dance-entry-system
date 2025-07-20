'use client'

import { useState } from 'react'
import Link from 'next/link'
export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    details?: string[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setUploadResult({
          success: false,
          message: 'CSVファイルを選択してください'
        })
        return
      }
      setFile(selectedFile)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setUploadResult({
        success: false,
        message: 'ファイルを選択してください'
      })
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        setUploadResult({
          success: true,
          message: result.message || 'インポートが完了しました',
          details: result.details
        })
        setFile(null)
        // ファイル入力をリセット
        const fileInput = document.getElementById('csv-file') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setUploadResult({
          success: false,
          message: result.error || 'インポートに失敗しました',
          details: result.details
        })
      }
    } catch {
      setUploadResult({
        success: false,
        message: 'インポート中にエラーが発生しました'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleTestUpload = async () => {
    if (!file) {
      setUploadResult({
        success: false,
        message: 'ファイルを選択してください'
      })
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/test-import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      console.log('Test import result:', result)

      setUploadResult({
        success: response.ok,
        message: result.message,
        details: [
          `ファイル名: ${result.debug?.fileName}`,
          `総行数: ${result.analysis?.totalLines}`,
          `空でない行数: ${result.analysis?.nonEmptyLines}`,
          `ヘッダー数: ${result.analysis?.headers?.length || 0}`,
          `データ行数: ${result.analysis?.dataLines?.length || 0}`,
          '--- ヘッダー ---',
          ...(result.analysis?.headers || []).map((h: string, i: number) => `${i + 1}: ${h}`),
          '--- 最初のデータ行 ---',
          ...(result.analysis?.dataLines?.[0]?.values || []).map((v: string, i: number) => `${i + 1}: ${v}`)
        ]
      })
    } catch (error) {
      console.error('Test upload error:', error)
      setUploadResult({
        success: false,
        message: 'テストアップロード中にエラーが発生しました'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/csv-template')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'entry_template.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        setUploadResult({
          success: false,
          message: 'テンプレートのダウンロードに失敗しました'
        })
      }
    } catch {
      setUploadResult({
        success: false,
        message: 'テンプレートのダウンロード中にエラーが発生しました'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">CSVインポート</h1>
              <Link
                href="/admin/dashboard"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                ダッシュボードに戻る
              </Link>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6 space-y-6">
            {/* テンプレートダウンロードセクション */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                1. CSVテンプレートをダウンロード
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                まず、CSVテンプレートをダウンロードして、必要な情報を入力してください。
              </p>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                CSVテンプレートをダウンロード
              </button>
            </div>

            {/* ファイルアップロードセクション */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">
                2. CSVファイルをアップロード
              </h2>
              <p className="text-sm text-gray-600">
                記入済みのCSVファイルを選択してアップロードしてください。
              </p>

              <div className="flex items-center space-x-4">
                <input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                />
                <button
                  onClick={handleTestUpload}
                  disabled={!file || isUploading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
                  </svg>
                  テスト
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    !file || isUploading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      アップロード中...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      アップロード
                    </>
                  )}
                </button>
              </div>

              {file && (
                <p className="text-sm text-gray-600">
                  選択されたファイル: {file.name}
                </p>
              )}
            </div>

            {/* アップロード結果 */}
            {uploadResult && (
              <div className={`rounded-md p-4 ${
                uploadResult.success ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {uploadResult.success ? (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      uploadResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {uploadResult.message}
                    </p>
                    {uploadResult.details && uploadResult.details.length > 0 && (
                      <ul className={`mt-2 text-sm ${
                        uploadResult.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {uploadResult.details.map((detail, index) => (
                          <li key={index}>• {detail}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 注意事項 */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">注意事項</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>CSVファイルの文字コードはUTF-8（BOM付き）で保存してください</li>
                      <li>1行目のヘッダー行は変更しないでください</li>
                      <li>ダンスジャンルは既定の選択肢から選択してください</li>
                      <li>重複するメールアドレスがある場合はエラーになります</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}