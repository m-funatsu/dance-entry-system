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

  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select(`
      id,
      user_id,
      dance_style,
      participant_names,
      phone_number,
      status,
      basic_info_status,
      created_at,
      updated_at,
      users(name, email),
      entry_files(id, file_type),
      selections(id, status, score, created_at),
      basic_info!left(id, dance_style, category_division),
      preliminary_info!left(id),
      program_info!left(id),
      semifinals_info!left(id),
      finals_info!left(id),
      applications_info!left(id),
      sns_info!left(id)
    `)
    .order('created_at', { ascending: false })

  // デバッグ: 取得したデータを確認
  if (entriesError) {
    console.error('エントリー取得エラー:', entriesError)
  }
  console.log('=== エントリーデータ取得結果 ===')
  console.log('エントリー数:', entries?.length || 0)
  if (entries && entries.length > 0) {
    console.log('最初のエントリーの構造:')
    console.log('- ID:', entries[0].id)
    console.log('- entries.dance_style:', entries[0].dance_style)
    console.log('- basic_info:', JSON.stringify(entries[0].basic_info))
    console.log('- preliminary_info:', JSON.stringify(entries[0].preliminary_info))
    console.log('- program_info:', JSON.stringify(entries[0].program_info))
    console.log('- semifinals_info:', JSON.stringify(entries[0].semifinals_info))
    console.log('- finals_info:', JSON.stringify(entries[0].finals_info))
    console.log('- applications_info:', JSON.stringify(entries[0].applications_info))
    console.log('- sns_info:', JSON.stringify(entries[0].sns_info))
    if (entries[0].basic_info && Array.isArray(entries[0].basic_info) && entries[0].basic_info.length > 0) {
      console.log('- basic_info[0]:', JSON.stringify(entries[0].basic_info[0]))
    } else if (entries[0].basic_info && !Array.isArray(entries[0].basic_info)) {
      console.log('- basic_info (not array):', JSON.stringify(entries[0].basic_info))
    }
  }
  console.log('================================')

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