import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userProfile || userProfile.role !== 'admin') {
    redirect('/dashboard')
  }

  // システム設定を取得
  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .order('key', { ascending: true })

  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>) || {}

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
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {userProfile.name}さん（管理者）
              </span>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                システム設定
              </h2>

              <div className="space-y-6">
                {/* エントリー期限設定 */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">エントリー期限</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        エントリー受付期限
                      </label>
                      <input
                        type="datetime-local"
                        defaultValue={settingsMap.entry_deadline || ''}
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
                        defaultValue={settingsMap.upload_deadline || ''}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        この日時以降、ファイルのアップロードを停止します
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
                        defaultValue={settingsMap.max_file_size || '100'}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ファイル数制限（種類ごと）
                      </label>
                      <input
                        type="number"
                        defaultValue={settingsMap.max_files_per_type || '5'}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
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
                        defaultChecked={settingsMap.email_notifications === 'true'}
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
                        defaultValue={settingsMap.admin_email || ''}
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
                        defaultValue={settingsMap.site_title || 'ダンスエントリーシステム'}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        エントリー受付メッセージ
                      </label>
                      <textarea
                        rows={3}
                        defaultValue={settingsMap.entry_message || ''}
                        placeholder="エントリーページに表示するメッセージを入力してください"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* 保存ボタン */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    設定を保存
                  </button>
                </div>

                {/* 開発中の注意 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        設定保存機能は開発中
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>現在、設定の保存機能は実装中です。表示のみ可能です。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}