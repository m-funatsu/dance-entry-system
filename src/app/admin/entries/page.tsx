import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EntriesWithFilters from './EntriesWithFilters'

export default async function AdminEntriesPage() {
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

  const { data: entries } = await supabase
    .from('entries')
    .select(`
      *,
      users(name, email),
      entry_files(id, file_type),
      selections(id, status, score, created_at),
      basic_info(id, dance_style, category_division),
      preliminary_info(id),
      program_info(id),
      semifinals_info(id),
      finals_info(id),
      applications_info(id),
      sns_info(id)
    `)
    .order('created_at', { ascending: false })

  // 管理者クライアントで全ユーザーデータを取得
  const adminSupabase = createAdminClient()
  const { data: allUsers } = await adminSupabase
    .from('users')
    .select('*')

  // 手動でユーザーデータをマッピング（安全な処理）
  const entriesWithUsers = entries?.map(entry => {
    const user = allUsers?.find(u => u.id === entry.user_id)
    return {
      ...entry,
      users: user ? { 
        name: user.name || '不明なユーザー', 
        email: user.email || 'メールアドレス不明' 
      } : { 
        name: '不明なユーザー', 
        email: 'メールアドレス不明' 
      }
    }
  }) || []

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
                エントリー一覧
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <EntriesWithFilters entries={entriesWithUsers} />
        </div>
      </main>
    </div>
  )
}