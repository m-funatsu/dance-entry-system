import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminTestDataPage() {
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

  // 現在のデータ状況を確認
  const { data: entries } = await supabase
    .from('entries')
    .select('*')

  const { data: users } = await supabase
    .from('users')
    .select('*')

  const { data: settings } = await supabase
    .from('settings')
    .select('*')

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
                テストデータ確認
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

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6">
            {/* データベース状況 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">データベース状況</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{users?.length || 0}</div>
                  <div className="text-sm text-blue-600">ユーザー数</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{entries?.length || 0}</div>
                  <div className="text-sm text-green-600">エントリー数</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{settings?.length || 0}</div>
                  <div className="text-sm text-purple-600">設定数</div>
                </div>
              </div>
            </div>

            {/* ユーザー詳細 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">ユーザー一覧</h2>
              {users && users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">メール</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ロール</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">ユーザーデータがありません</p>
              )}
            </div>

            {/* エントリー詳細 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">エントリー一覧</h2>
              {entries && entries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ダンスジャンル</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">参加者名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {entries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.user_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.dance_style}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.participant_names}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">エントリーデータがありません</p>
              )}
            </div>

            {/* 開発用注意 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    開発用ページ
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>このページは開発・デバッグ用です。本番環境では削除してください。</p>
                    <p className="mt-1">ユーザーデータがない場合は、以下を確認してください：</p>
                    <ul className="mt-1 ml-4 list-disc">
                      <li>participantアカウントでエントリーを作成したか</li>
                      <li>Supabaseのusersテーブルにデータが正しく保存されているか</li>
                      <li>管理者アカウントでログインしているか</li>
                    </ul>
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