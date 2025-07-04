import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDateLocale } from '@/lib/utils'

export default async function StatusPage() {
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

  const { data: entry } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!entry) {
    redirect('/dashboard/entry?message=先にエントリー情報を入力してください')
  }

  const { data: selection } = await supabase
    .from('selections')
    .select('*, users!selections_admin_id_fkey(name)')
    .eq('entry_id', entry.id)
    .single()

  const { data: files } = await supabase
    .from('entry_files')
    .select('*')
    .eq('entry_id', entry.id)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            審査待ち
          </span>
        )
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            提出済み
          </span>
        )
      case 'selected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            選考通過
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            不選考
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            未設定
          </span>
        )
    }
  }

  const fileTypeCounts = {
    music: files?.filter(f => f.file_type === 'music').length || 0,
    audio: files?.filter(f => f.file_type === 'audio').length || 0,
    photo: files?.filter(f => f.file_type === 'photo').length || 0,
    video: files?.filter(f => f.file_type === 'video').length || 0,
  }

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
                選考状況
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
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                エントリー状況
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                  <dd className="mt-1">{getStatusBadge(entry.status)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">エントリー日時</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDateLocale(entry.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ダンスジャンル</dt>
                  <dd className="mt-1 text-sm text-gray-900">{entry.dance_style}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">チーム名</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {entry.team_name || '個人参加'}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                アップロードファイル状況
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {fileTypeCounts.music}
                  </div>
                  <div className="text-sm text-gray-500">楽曲</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {fileTypeCounts.audio}
                  </div>
                  <div className="text-sm text-gray-500">音源</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {fileTypeCounts.photo}
                  </div>
                  <div className="text-sm text-gray-500">写真</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {fileTypeCounts.video}
                  </div>
                  <div className="text-sm text-gray-500">動画</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <a
                  href="/dashboard/upload"
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  ファイルを管理 →
                </a>
              </div>
            </div>
          </div>

          {selection && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  選考結果
                </h2>
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">選考ステータス</dt>
                    <dd className="mt-1">{getStatusBadge(selection.status)}</dd>
                  </div>
                  {selection.score && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">スコア</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selection.score}/10
                      </dd>
                    </div>
                  )}
                  {selection.comments && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">コメント</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                        {selection.comments}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">評価日時</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDateLocale(selection.created_at)}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selection && entry.status === 'submitted' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">
                    選考審査中
                  </p>
                  <p className="text-sm text-blue-700">
                    エントリー内容を確認中です。結果をお待ちください。
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center space-x-4">
            <a
              href="/dashboard/entry"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              エントリー情報を編集
            </a>
            <a
              href="/dashboard/upload"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              ファイルを管理
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}