import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminImportPage() {
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
                データ取り込み
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
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Googleフォームデータ取り込み
              </h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      開発中の機能
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>この機能は現在開発中です。将来的にGoogleフォームのデータを直接取り込む機能を提供予定です。</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">CSVファイル取り込み</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    GoogleフォームからエクスポートしたCSVファイルをアップロードして、エントリーデータを一括登録できます。
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    disabled
                  />
                  <button
                    type="button"
                    disabled
                    className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                  >
                    アップロード（開発中）
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Googleフォーム連携</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    GoogleフォームのAPIを使用して、リアルタイムでエントリーデータを同期します。
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        GoogleフォームURL
                      </label>
                      <input
                        type="url"
                        placeholder="https://forms.google.com/..."
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled
                      />
                    </div>
                    <button
                      type="button"
                      disabled
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                    >
                      連携設定（開発中）
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">インポート履歴</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    過去のデータ取り込み履歴を確認できます。
                  </p>
                  <div className="text-center py-8 text-gray-500">
                    まだインポート履歴がありません
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