'use client'

import { useState } from 'react'
import { UnifiedFileUpload } from '@/components/ui'

export default function TestUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            統一ファイルアップロードテスト
          </h1>
          
          <div className="space-y-8">
            {/* 画像アップロード */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">画像ファイル</h2>
              <UnifiedFileUpload
                label="テスト画像アップロード"
                category="image"
                maxSizeMB={10}
                showStatusBar={true}
                hidePreviewUntilComplete={true}
                onChange={(file) => {
                  console.log('画像ファイル選択:', file.name)
                  setSelectedFile(file)
                }}
                onUploadComplete={(url) => {
                  console.log('画像アップロード完了:', url)
                  setUploadedUrl(url)
                }}
                value={uploadedUrl}
                helperText="画像ファイルをアップロードしてステータスバーの動作を確認してください"
              />
            </div>

            {/* 動画アップロード */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">動画ファイル</h2>
              <UnifiedFileUpload
                label="テスト動画アップロード"
                category="video"
                maxSizeMB={200}
                showStatusBar={true}
                hidePreviewUntilComplete={true}
                onChange={(file) => {
                  console.log('動画ファイル選択:', file.name)
                }}
                onUploadComplete={(url) => {
                  console.log('動画アップロード完了:', url)
                }}
                helperText="動画ファイルをアップロードしてステータスバーの動作を確認してください"
              />
            </div>

            {/* 音声ファイルアップロード */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">音声ファイル</h2>
              <UnifiedFileUpload
                label="テスト音声アップロード"
                category="audio"
                maxSizeMB={50}
                showStatusBar={true}
                hidePreviewUntilComplete={true}
                onChange={(file) => {
                  console.log('音声ファイル選択:', file.name)
                }}
                onUploadComplete={(url) => {
                  console.log('音声アップロード完了:', url)
                }}
                helperText="音声ファイルをアップロードしてステータスバーの動作を確認してください"
              />
            </div>

            {/* ドキュメントアップロード */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">ドキュメントファイル</h2>
              <UnifiedFileUpload
                label="テストドキュメントアップロード"
                category="document"
                maxSizeMB={20}
                showStatusBar={true}
                hidePreviewUntilComplete={true}
                onChange={(file) => {
                  console.log('ドキュメントファイル選択:', file.name)
                }}
                onUploadComplete={(url) => {
                  console.log('ドキュメントアップロード完了:', url)
                }}
                helperText="ドキュメントファイルをアップロードしてステータスバーの動作を確認してください"
              />
            </div>
          </div>

          {/* デバッグ情報 */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">デバッグ情報</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>選択されたファイル: {selectedFile ? selectedFile.name : '未選択'}</p>
              <p>アップロードURL: {uploadedUrl || '未アップロード'}</p>
              <p>ブラウザ開発者ツールのコンソールで詳細ログを確認できます</p>
            </div>
          </div>

          {/* 説明 */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">テスト手順</h3>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>各セクションでファイルを選択またはドラッグ&ドロップしてください</li>
              <li>画面右上に統一ステータスバーが表示されることを確認してください</li>
              <li>プログレスバーがアップロード進行状況を表示することを確認してください</li>
              <li>アップロード完了後にプレビューが表示されることを確認してください</li>
              <li>エラーが発生した場合の表示を確認してください</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}