import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import BackgroundSettings from './BackgroundSettings'

export default async function BackgroundPage() {
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

  // 背景画像設定を取得
  const adminSupabase = createAdminClient()
  const { data: settings } = await adminSupabase
    .from('settings')
    .select('*')
    .in('key', ['login_background_image', 'dashboard_background_image', 'entry_background_image', 'music_background_image'])

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
              <AdminLink href="/admin/dashboard" className="text-indigo-600 hover:text-indigo-900">
                ← 管理ダッシュボードに戻る
              </AdminLink>
              <h1 className="text-2xl font-bold text-gray-900">
                背景画像設定
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {userProfile.name}さん（管理者）
              </span>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer"
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
                各画面の背景画像URL設定
              </h2>
              <BackgroundSettings initialSettings={settingsMap} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}