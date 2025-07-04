import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EntryForm from './EntryForm'

export default async function EntryPage() {
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

  if (!userProfile) {
    redirect('/auth/login')
  }

  if (userProfile.role !== 'participant') {
    redirect('/admin/dashboard')
  }

  // 最新のエントリーを1件取得（複数ある場合は最新のもの）
  const { data: entries, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const existingEntry = entries && entries.length > 0 ? entries[0] : null

  console.log('Server-side entry fetch:', { existingEntry, entryError, userId: user.id })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-indigo-600 hover:text-indigo-900">
                ← ダッシュボードに戻る
              </a>
              <h1 className="text-2xl font-bold text-gray-900">
                エントリー情報
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {userProfile.name}さん
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
                {existingEntry ? 'エントリー情報の編集' : 'エントリー情報の入力'}
              </h2>
              
              {/* デバッグ情報 */}
              <div className="mb-4 p-4 bg-yellow-100 rounded text-sm">
                <strong>サーバーサイドデバッグ:</strong><br/>
                UserId: {user.id}<br/>
                Entries Count: {entries?.length || 0}<br/>
                ExistingEntry: {existingEntry ? 'あり' : 'なし'}<br/>
                EntryError: {entryError ? `${entryError.message} (${entryError.code})` : 'なし'}<br/>
                {existingEntry && (
                  <>Entry Data: {JSON.stringify(existingEntry, null, 2)}</>
                )}
              </div>
              <EntryForm 
                userId={user.id}
                existingEntry={existingEntry}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}