import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EntryDetail from './EntryDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EntryDetailPage({ params }: PageProps) {
  const resolvedParams = await params
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

  // 管理者クライアントでエントリーデータを取得
  const adminSupabase = createAdminClient()
  const { data: entry } = await adminSupabase
    .from('entries')
    .select(`
      *,
      users(name, email),
      entry_files(*),
      selections(*, users!selections_admin_id_fkey(name)),
      basic_info(*),
      preliminary_info(*),
      program_info(*),
      semifinals_info(*),
      finals_info(*),
      applications_info(*),
      sns_info(*)
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (!entry) {
    notFound()
  }

  // 管理者クライアントを使用してもユーザー情報が取得できない場合のフォールバック
  if (!entry.users && entry.user_id) {
    const { data: userData } = await adminSupabase
      .from('users')
      .select('name, email')
      .eq('id', entry.user_id)
      .single()
    
    entry.users = userData ? {
      name: userData.name || '不明なユーザー',
      email: userData.email || 'メールアドレス不明'
    } : {
      name: '不明なユーザー',
      email: 'メールアドレス不明'
    }
  } else if (!entry.users) {
    entry.users = {
      name: '不明なユーザー',
      email: 'メールアドレス不明'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/entries" className="text-indigo-600 hover:text-indigo-900">
                ← エントリー一覧に戻る
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                エントリー詳細
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
          <EntryDetail entry={entry} />
        </div>
      </main>
    </div>
  )
}