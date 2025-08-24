import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import AdminLink from '@/components/admin/AdminLink'
import DataExportManager from '@/components/DataExportManager'
import NavigationLogger from '@/components/NavigationLogger'

export default async function AdminDashboardPage() {
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

  // 管理者クライアントでデータを取得
  const adminSupabase = createAdminClient()
  const [entriesResult, usersResult, filesResult, basicInfoResult, preliminaryInfoResult] = await Promise.all([
    adminSupabase.from('entries').select('*').order('created_at', { ascending: false }),
    adminSupabase.from('users').select('id, name, email'),
    adminSupabase.from('entry_files').select('id, entry_id, file_type, purpose'),
    adminSupabase.from('basic_info').select('*'),
    adminSupabase.from('preliminary_info').select('*')
  ])
  
  const { data: entries } = entriesResult
  const { data: allUsers } = usersResult
  const { data: allFiles } = filesResult
  const { data: allBasicInfo } = basicInfoResult
  const { data: allPreliminaryInfo } = preliminaryInfoResult

  // 必須項目の判定関数
  const checkBasicInfoComplete = (basicInfo: { [key: string]: unknown } | null) => {
    if (!basicInfo) return false
    const requiredFields = [
      'dance_style',
      'representative_name',
      'representative_furigana',
      'representative_email',
      'partner_name',
      'partner_furigana',
      'phone_number',
      'choreographer',
      'choreographer_furigana',
      'agreement_checked',
      'privacy_policy_checked'
    ]
    return requiredFields.every(field => {
      const value = basicInfo[field]
      if (typeof value === 'boolean') return value === true
      return value && value.toString().trim() !== ''
    })
  }

  const checkPreliminaryInfoComplete = (preliminaryInfo: { [key: string]: unknown } | null, hasVideo: boolean) => {
    if (!preliminaryInfo) return false
    if (!hasVideo) return false
    const requiredFields = [
      'work_title',
      'work_story',
      'music_rights_cleared',
      'music_title',
      'cd_title',
      'artist',
      'record_number',
      'jasrac_code',
      'music_type'
    ]
    return requiredFields.every(field => {
      const value = preliminaryInfo[field]
      return value && value.toString().trim() !== ''
    })
  }

  // 手動でユーザーデータと関連情報をマッピング（安全な処理）
  const entriesWithUsers = entries?.map(entry => {
    const user = allUsers?.find(u => u.id === entry.user_id)
    const basicInfo = allBasicInfo?.find(b => b.entry_id === entry.id)
    const preliminaryInfo = allPreliminaryInfo?.find(p => p.entry_id === entry.id)
    const entryFiles = allFiles?.filter(f => f.entry_id === entry.id) || []
    const hasVideo = entryFiles.some(f => f.file_type === 'video' && f.purpose === 'preliminary')
    
    // 必須項目の完了状況を判定
    const basicInfoComplete = checkBasicInfoComplete(basicInfo)
    const preliminaryInfoComplete = checkPreliminaryInfoComplete(preliminaryInfo, hasVideo)
    
    // 提出ステータスを判定（両方の必須項目が完了していれば提出済み）
    const isSubmitted = basicInfoComplete && preliminaryInfoComplete
    
    return {
      ...entry,
      users: user ? { 
        name: user.name || '不明なユーザー' 
      } : { 
        name: '不明なユーザー' 
      },
      basic_info: basicInfo,
      preliminary_info: preliminaryInfo,
      entry_files: entryFiles,
      isSubmitted
    }
  }) || []

  // 予選向け情報（基本情報＋予選情報）が完了しているエントリー数
  const preliminarySubmitted = entriesWithUsers.filter(e => {
    const hasBasicInfo = e.basic_info && checkBasicInfoComplete(e.basic_info)
    const hasPreliminaryInfo = e.preliminary_info && checkPreliminaryInfoComplete(e.preliminary_info, e.entry_files.some((f: { file_type: string; purpose: string }) => f.file_type === 'video' && f.purpose === 'preliminary'))
    return hasBasicInfo && hasPreliminaryInfo
  }).length
  
  // 本選向け情報（準決勝以降の情報）が完了しているエントリー数
  const finalsSubmitted = entriesWithUsers.filter(e => {
    const hasSemifinalsInfo = e.semifinals_info
    const hasFinalsInfo = e.finals_info
    const hasApplicationsInfo = e.applications_info
    const hasSnsInfo = e.sns_info
    return !!(hasSemifinalsInfo && hasFinalsInfo && hasApplicationsInfo && hasSnsInfo)
  }).length

  const stats = {
    total: entriesWithUsers.length,
    preliminarySubmitted: preliminarySubmitted,
    selected: entriesWithUsers.filter(e => e.status === 'selected').length,
    rejected: entriesWithUsers.filter(e => e.status === 'rejected').length,
    finalsSubmitted: finalsSubmitted,
  }

  // ダンスジャンル別統計を計算
  const danceGenreStats = entriesWithUsers.reduce((acc, entry) => {
    let genre = '未分類'
    
    if (entry.basic_info?.dance_style) {
      genre = entry.basic_info.dance_style as string
    }
    
    acc[genre] = (acc[genre] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // ダンスジャンル統計を配列に変換してソート
  const danceGenreArray = Object.entries(danceGenreStats)
    .map(([genre, count]) => ({ genre, count: Number(count) }))
    .sort((a, b) => b.count - a.count)

  return (
    <>
      <NavigationLogger />
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">
                管理者ダッシュボード
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                ようこそ、{userProfile.name}さん（管理者）
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{stats.total}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        総エントリー数
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{stats.preliminarySubmitted}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        予選向け情報提出状況
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.preliminarySubmitted} / {stats.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{stats.selected}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        予選通過数
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.selected}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{stats.rejected}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        予選敗退数
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.rejected}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{stats.finalsSubmitted}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        本選向け情報提出状況
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.finalsSubmitted} / {stats.total}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ダンスジャンル別統計 */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">ダンスジャンル別エントリー数</h2>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                {danceGenreArray.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {danceGenreArray.map(({ genre, count }) => (
                      <div key={genre} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate" title={genre}>
                            {genre}
                          </div>
                          <div className="text-xs text-gray-500">
                            {count}件のエントリー
                          </div>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">エントリーがありません</h3>
                    <p className="mt-1 text-sm text-gray-500">まだダンスエントリーが登録されていません。</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        エントリー一覧
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        全エントリーを管理
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <div className="space-y-2">
                    <AdminLink href="/admin/entries" className="block font-medium text-indigo-600 hover:text-indigo-500">
                      エントリー一覧を表示 →
                    </AdminLink>
                    <AdminLink href="/admin/test-data" className="block text-sm text-gray-600 hover:text-gray-800">
                      🔧 テストデータ確認
                    </AdminLink>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        期日管理
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        各セクションの入力開始日と締切日
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <AdminLink href="/admin/deadlines" className="font-medium text-indigo-600 hover:text-indigo-500">
                    期日を設定 →
                  </AdminLink>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        システム設定
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        大会情報・通知設定
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <AdminLink href="/admin/settings" className="font-medium text-indigo-600 hover:text-indigo-500">
                    設定を変更 →
                  </AdminLink>
                </div>
              </div>
            </div>


            {/* 背景画像設定カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        背景画像設定
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        各画面の背景画像を管理
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <AdminLink href="/admin/background" className="font-medium text-indigo-600 hover:text-indigo-500">
                    背景画像設定 →
                  </AdminLink>
                </div>
              </div>
            </div>

            {/* 通知テンプレート管理カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        通知テンプレート
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        メール通知のテンプレートを管理
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <AdminLink href="/admin/templates" className="font-medium text-indigo-600 hover:text-indigo-500">
                    テンプレート管理 →
                  </AdminLink>
                </div>
              </div>
            </div>

          </div>

          {/* データエクスポート機能 */}
          <div className="mt-8">
            <DataExportManager 
              totalEntries={stats.total}
              totalFiles={allFiles?.length || 0}
            />
          </div>
        </div>
      </main>
      </div>
    </>
  )
}