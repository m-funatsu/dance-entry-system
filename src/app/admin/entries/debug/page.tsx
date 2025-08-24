import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'

export default async function DebugDataPage() {
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

  const adminSupabase = createAdminClient()
  
  // 各テーブルの件数を確認
  const [
    entriesCount,
    basicInfoCount,
    preliminaryInfoCount,
    programInfoCount,
    semifinalsInfoCount,
    finalsInfoCount,
    snsInfoCount,
    applicationsInfoCount,
    usersCount,
    entryFilesCount
  ] = await Promise.all([
    adminSupabase.from('entries').select('id', { count: 'exact' }),
    adminSupabase.from('basic_info').select('id', { count: 'exact' }),
    adminSupabase.from('preliminary_info').select('id', { count: 'exact' }),
    adminSupabase.from('program_info').select('id', { count: 'exact' }),
    adminSupabase.from('semifinals_info').select('id', { count: 'exact' }),
    adminSupabase.from('finals_info').select('id', { count: 'exact' }),
    adminSupabase.from('sns_info').select('id', { count: 'exact' }),
    adminSupabase.from('applications_info').select('id', { count: 'exact' }),
    adminSupabase.from('users').select('id', { count: 'exact' }),
    adminSupabase.from('entry_files').select('id', { count: 'exact' })
  ])

  // サンプルデータも取得
  const [
    sampleBasicInfo,
    sampleEntries,
    sampleUsers
  ] = await Promise.all([
    adminSupabase.from('basic_info').select('*').limit(3),
    adminSupabase.from('entries').select('*').limit(3),
    adminSupabase.from('users').select('*').limit(3)
  ])

  console.log('=== DEBUG DATA COUNTS ===')
  console.log('entries:', entriesCount.count)
  console.log('basic_info:', basicInfoCount.count)
  console.log('preliminary_info:', preliminaryInfoCount.count)
  console.log('program_info:', programInfoCount.count)
  console.log('semifinals_info:', semifinalsInfoCount.count)
  console.log('finals_info:', finalsInfoCount.count)
  console.log('sns_info:', snsInfoCount.count)
  console.log('applications_info:', applicationsInfoCount.count)
  console.log('users:', usersCount.count)
  console.log('entry_files:', entryFilesCount.count)
  
  console.log('=== SAMPLE DATA ===')
  console.log('sampleBasicInfo:', sampleBasicInfo.data)
  console.log('sampleEntries:', sampleEntries.data)
  console.log('sampleUsers:', sampleUsers.data)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">データベース確認</h1>
          <p className="text-gray-600">各テーブルのデータ件数を確認</p>
        </div>
        <AdminLink href="/admin/entries">
          エントリー一覧に戻る
        </AdminLink>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">テーブル件数</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">エントリー</div>
            <div className="text-xl font-bold">{entriesCount.count || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">基本情報</div>
            <div className="text-xl font-bold">{basicInfoCount.count || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">予選情報</div>
            <div className="text-xl font-bold">{preliminaryInfoCount.count || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">プログラム情報</div>
            <div className="text-xl font-bold">{programInfoCount.count || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">準決勝情報</div>
            <div className="text-xl font-bold">{semifinalsInfoCount.count || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">決勝情報</div>
            <div className="text-xl font-bold">{finalsInfoCount.count || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">SNS情報</div>
            <div className="text-xl font-bold">{snsInfoCount.count || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">各種申請</div>
            <div className="text-xl font-bold">{applicationsInfoCount.count || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">ユーザー</div>
            <div className="text-xl font-bold">{usersCount.count || 0}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">ファイル</div>
            <div className="text-xl font-bold">{entryFilesCount.count || 0}</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">サンプルデータ</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">基本情報 (最新3件)</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(sampleBasicInfo.data, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="font-medium">エントリー (最新3件)</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(sampleEntries.data, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}