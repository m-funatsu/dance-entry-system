import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import EntryDetail from './EntryDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EntryDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  const supabase = createClient()
  
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

  const { data: entry } = await supabase
    .from('entries')
    .select(`
      *,
      users(name, email),
      entry_files(*),
      selections(*, users!selections_admin_id_fkey(name))
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (!entry) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <a href="/admin/entries" className="text-indigo-600 hover:text-indigo-900">
                ← エントリー一覧に戻る
              </a>
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
          <EntryDetail entry={entry} adminId={user.id} />
        </div>
      </main>
    </div>
  )
}