import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import EntryTable from './EntryTable'

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
      selections(id, status, score, created_at)
    `)
    .order('created_at', { ascending: false })

  // 管理者クライアントで全ユーザーデータを取得
  const adminSupabase = createAdminClient()
  const { data: allUsers, error: usersError } = await adminSupabase
    .from('users')
    .select('*')

  // デバッグ用ログ（一時的）
  console.log('📊 Admin Entries Debug Info:')
  console.log('Total entries:', entries?.length)
  console.log('Total users:', allUsers?.length)
  console.log('Users error:', usersError)
  console.log('Sample entry:', entries?.[0])
  console.log('Sample user:', allUsers?.[0])

  // 手動でユーザーデータをマッピング（安全な処理）
  const entriesWithUsers = entries?.map(entry => {
    const user = allUsers?.find(u => u.id === entry.user_id)
    console.log(`Entry ${entry.id}: user_id=${entry.user_id}, found_user=${!!user}, user_name=${user?.name}`)
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
              <a
                href="/admin/import"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                データ取り込み
              </a>
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
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900">
                  全エントリー ({entries?.length || 0}件)
                </h2>
                <div className="flex space-x-2">
                  <select className="rounded-md border-gray-300 text-sm">
                    <option value="">全ステータス</option>
                    <option value="pending">未処理</option>
                    <option value="submitted">提出済み</option>
                    <option value="selected">選考通過</option>
                    <option value="rejected">不選考</option>
                  </select>
                  <select className="rounded-md border-gray-300 text-sm">
                    <option value="">全ジャンル</option>
                    <option value="hip-hop">Hip-Hop</option>
                    <option value="jazz">Jazz</option>
                    <option value="contemporary">Contemporary</option>
                    <option value="ballet">Ballet</option>
                    <option value="street">Street</option>
                    <option value="breakdance">Breakdance</option>
                    <option value="k-pop">K-Pop</option>
                    <option value="other">その他</option>
                  </select>
                </div>
              </div>
              
              <EntryTable entries={entriesWithUsers} adminId={user.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}