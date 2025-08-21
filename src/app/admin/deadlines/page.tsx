import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DeadlineSettings from './DeadlineSettings'

export default async function AdminDeadlinesPage() {
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

  // 期日設定を取得
  const { data: settings } = await supabase
    .from('settings')
    .select('*')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <AdminLink href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-900">
                ← 管理者ダッシュボードに戻る
              </AdminLink>
              <h1 className="text-2xl font-bold text-gray-900">
                期日管理
              </h1>
            </div>
            <div className="flex items-center space-x-4">
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                各セクションの入力開始日と締切日
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                各セクションの入力開始日と締切日を設定できます。準決勝、決勝、参加同意書、SNS、各種申請は共通の入力開始日が設定されます。
              </p>
              <DeadlineSettings initialSettings={settings || []} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}