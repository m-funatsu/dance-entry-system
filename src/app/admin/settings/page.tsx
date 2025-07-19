'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
interface Settings {
  entry_deadline: string
  upload_deadline: string
  max_file_size: string
  max_files_per_type: string
  email_notifications: string
  admin_email: string
  site_title: string
  entry_message: string
  competition_name: string
  competition_year: string
  competition_date: string
  competition_venue: string
  application_start_date: string
  application_end_date: string
  announcement_date: string
  max_entries: string
  // 各フォームごとの期限
  basic_info_deadline: string
  music_info_deadline: string
  additional_info_deadline: string
  optional_request_deadline: string
  // ファビコン設定
  favicon_url: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    entry_deadline: '',
    upload_deadline: '',
    max_file_size: '100',
    max_files_per_type: '5',
    email_notifications: 'true',
    admin_email: '',
    site_title: '2025 バルカーカップ ダンスエントリーシステム',
    entry_message: '',
    competition_name: 'バルカーカップ',
    competition_year: '2025',
    competition_date: '',
    competition_venue: '',
    application_start_date: '',
    application_end_date: '',
    announcement_date: '',
    max_entries: '100',
    basic_info_deadline: '',
    music_info_deadline: '',
    additional_info_deadline: '',
    optional_request_deadline: '',
    favicon_url: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false)
  const [isDeletingFavicon, setIsDeletingFavicon] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data.settings }))
      }
    } catch (error) {
      console.error('設定の取得に失敗しました:', error)
      setMessage({ type: 'error', text: '設定の取得に失敗しました' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: '設定を保存しました' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || '設定の保存に失敗しました' })
      }
    } catch (error) {
      console.error('設定保存エラー:', error)
      setMessage({ type: 'error', text: '設定の保存中にエラーが発生しました' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: keyof Settings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: typeof value === 'boolean' ? value.toString() : value
    }))
  }

  const handleFaviconUpload = async () => {
    if (!faviconFile) {
      setMessage({ type: 'error', text: 'ファビコンファイルを選択してください' })
      return
    }

    setIsUploadingFavicon(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('favicon', faviconFile)

      const response = await fetch('/api/admin/favicon', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setSettings(prev => ({ ...prev, favicon_url: result.url }))
        setFaviconFile(null)
        // ファイル入力をリセット
        const fileInput = document.getElementById('favicon-file') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        setMessage({ type: 'success', text: 'ファビコンをアップロードしました' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'ファビコンのアップロードに失敗しました' })
      }
    } catch {
      setMessage({ type: 'error', text: 'ファビコンのアップロード中にエラーが発生しました' })
    } finally {
      setIsUploadingFavicon(false)
    }
  }

  const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ファイル形式のチェック
      const allowedTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/ico']
      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.ico')) {
        setMessage({ type: 'error', text: 'ICOまたはPNG形式のファイルを選択してください' })
        return
      }
      // ファイルサイズのチェック（1MB以下）
      if (file.size > 1024 * 1024) {
        setMessage({ type: 'error', text: 'ファイルサイズは1MB以下にしてください' })
        return
      }
      setFaviconFile(file)
      setMessage(null)
    }
  }

  const handleFaviconDelete = async () => {
    if (!settings.favicon_url) {
      setMessage({ type: 'error', text: '削除するファビコンがありません' })
      return
    }

    if (!confirm('ファビコンを削除しますか？この操作は取り消せません。')) {
      return
    }

    setIsDeletingFavicon(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/favicon', {
        method: 'DELETE'
      })

      if (response.ok) {
        setSettings(prev => ({ ...prev, favicon_url: '' }))
        setMessage({ type: 'success', text: 'ファビコンを削除しました' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'ファビコンの削除に失敗しました' })
      }
    } catch {
      setMessage({ type: 'error', text: 'ファビコンの削除中にエラーが発生しました' })
    } finally {
      setIsDeletingFavicon(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-900">
                ← 管理ダッシュボードに戻る
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                システム設定
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="px-4 py-6 sm:px-0">
          {message && (
            <div className={`mb-6 rounded-md p-4 ${
              message.type === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          )}

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                システム設定
              </h2>

              <div className="space-y-6">
                {/* 大会基本情報 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">大会基本情報</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          大会名
                        </label>
                        <input
                          type="text"
                          value={settings.competition_name}
                          onChange={(e) => handleChange('competition_name', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          開催年
                        </label>
                        <input
                          type="text"
                          value={settings.competition_year}
                          onChange={(e) => handleChange('competition_year', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        開催日
                      </label>
                      <input
                        type="date"
                        value={settings.competition_date}
                        onChange={(e) => handleChange('competition_date', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        開催場所
                      </label>
                      <input
                        type="text"
                        value={settings.competition_venue}
                        onChange={(e) => handleChange('competition_venue', e.target.value)}
                        placeholder="例: 東京国際フォーラム"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* エントリー期限設定 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">エントリー期限</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        エントリー受付開始日時
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.application_start_date}
                        onChange={(e) => handleChange('application_start_date', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        エントリー受付終了日時
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.entry_deadline}
                        onChange={(e) => handleChange('entry_deadline', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        この日時以降、新規エントリーの受付を停止します
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ファイルアップロード期限
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.upload_deadline}
                        onChange={(e) => handleChange('upload_deadline', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        この日時以降、ファイルのアップロードを停止します
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        選考結果発表日
                      </label>
                      <input
                        type="date"
                        value={settings.announcement_date}
                        onChange={(e) => handleChange('announcement_date', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 各フォームごとの期限設定 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">各フォームごとの期限設定</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        基本情報フォーム期限
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.basic_info_deadline}
                        onChange={(e) => handleChange('basic_info_deadline', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        基本情報（代表者名、パートナー名、ダンスジャンル等）の入力期限
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        楽曲情報フォーム期限
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.music_info_deadline}
                        onChange={(e) => handleChange('music_info_deadline', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        楽曲情報（楽曲タイトル、アーティスト、作品テーマ等）の入力期限
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        追加情報フォーム期限
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.additional_info_deadline}
                        onChange={(e) => handleChange('additional_info_deadline', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        追加情報（協賛企業、備考、ファイルアップロード）の入力期限
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        任意申請フォーム期限
                      </label>
                      <input
                        type="datetime-local"
                        value={settings.optional_request_deadline}
                        onChange={(e) => handleChange('optional_request_deadline', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        任意申請の入力期限
                      </p>
                    </div>
                  </div>
                </div>

                {/* ファイル制限設定 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">ファイル制限</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        最大ファイルサイズ (MB)
                      </label>
                      <input
                        type="number"
                        value={settings.max_file_size}
                        onChange={(e) => handleChange('max_file_size', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ファイル数制限（種類ごと）
                      </label>
                      <input
                        type="number"
                        value={settings.max_files_per_type}
                        onChange={(e) => handleChange('max_files_per_type', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* エントリー制限設定 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">エントリー制限</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      最大エントリー数
                    </label>
                    <input
                      type="number"
                      value={settings.max_entries}
                      onChange={(e) => handleChange('max_entries', e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      この数に達するとエントリーを自動的に締め切ります（0で無制限）
                    </p>
                  </div>
                </div>

                {/* メール設定 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">通知設定</h3>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="email_notifications"
                        type="checkbox"
                        checked={settings.email_notifications === 'true'}
                        onChange={(e) => handleChange('email_notifications', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-900">
                        エントリー時にメール通知を送信
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        管理者通知メールアドレス
                      </label>
                      <input
                        type="email"
                        value={settings.admin_email}
                        onChange={(e) => handleChange('admin_email', e.target.value)}
                        placeholder="admin@example.com"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 表示設定 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">表示設定</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        サイトタイトル
                      </label>
                      <input
                        type="text"
                        value={settings.site_title}
                        onChange={(e) => handleChange('site_title', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        エントリー受付メッセージ
                      </label>
                      <textarea
                        rows={3}
                        value={settings.entry_message}
                        onChange={(e) => handleChange('entry_message', e.target.value)}
                        placeholder="エントリーページに表示するメッセージを入力してください"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* ファビコン設定 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">ファビコン設定</h3>
                  <div className="space-y-4">
                    {settings.favicon_url && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          現在のファビコン
                        </label>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-8 h-8">
                              <Image
                                src={settings.favicon_url}
                                alt="現在のファビコン"
                                fill
                                className="object-contain"
                              />
                            </div>
                            <span className="text-sm text-gray-600">{settings.favicon_url}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleFaviconDelete}
                            disabled={isDeletingFavicon}
                            className={`inline-flex items-center px-3 py-1 border text-sm font-medium rounded-md ${
                              isDeletingFavicon
                                ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                                : 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                            }`}
                          >
                            {isDeletingFavicon ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                削除中...
                              </>
                            ) : (
                              '削除'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        新しいファビコンをアップロード
                      </label>
                      <div className="mt-1 flex items-center space-x-3">
                        <input
                          id="favicon-file"
                          type="file"
                          accept=".ico,.png,image/x-icon,image/png"
                          onChange={handleFaviconFileChange}
                          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleFaviconUpload}
                          disabled={!faviconFile || isUploadingFavicon}
                          className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                            !faviconFile || isUploadingFavicon
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                          }`}
                        >
                          {isUploadingFavicon ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              アップロード中...
                            </>
                          ) : (
                            'アップロード'
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        ICOまたはPNG形式、1MB以下のファイルを選択してください。推奨サイズ: 32x32px または 16x16px
                      </p>
                      {faviconFile && (
                        <p className="mt-1 text-sm text-green-600">
                          選択されたファイル: {faviconFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 保存ボタン */}
                <div className="flex justify-end space-x-3">
                  <Link
                    href="/admin/dashboard"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    キャンセル
                  </Link>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      isSaving
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        保存中...
                      </>
                    ) : (
                      '設定を保存'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}