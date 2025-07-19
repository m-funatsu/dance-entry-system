import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import MessageAlert from '@/components/MessageAlert'
import BackgroundLoader from '@/components/BackgroundLoader'

export default async function DashboardPage() {
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

  if (!userProfile) {
    redirect('/auth/login')
  }

  if (userProfile.role === 'admin') {
    redirect('/admin/dashboard')
  }

  // エントリー情報の取得（最新のエントリー）
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const entry = entries && entries.length > 0 ? entries[0] : null

  // ファイル情報の取得
  const fileStats = { music: 0, video: 0, photo: 0 }
  if (entry) {
    const { data: files } = await supabase
      .from('entry_files')
      .select('file_type')
      .eq('entry_id', entry.id)

    if (files) {
      files.forEach(file => {
        if (file.file_type === 'music') fileStats.music++
        else if (file.file_type === 'video') fileStats.video++
        else if (file.file_type === 'photo') fileStats.photo++
      })
    }
  }

  return (
    <>
      <BackgroundLoader pageType="dashboard" />
      <div className="min-h-screen bg-gray-50" style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), var(--dashboard-bg-image, none)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-3xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
                2025 バルカーカップ エントリー
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                ようこそ、{userProfile.name}さん
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
          <Suspense fallback={null}>
            <MessageAlert />
          </Suspense>
          
          {/* 選考状況セクション（最上部） */}
          {!userProfile.has_seed && entry && (
            <div className="mb-8">
              <div className="bg-white overflow-hidden shadow-lg rounded-lg border-2 border-indigo-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">選考状況</h2>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${
                          entry.status === 'selected' ? 'bg-green-100 text-green-800' :
                          entry.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          entry.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.status === 'pending' && '審査待ち'}
                          {entry.status === 'submitted' && '提出済み'}
                          {entry.status === 'selected' && '選考通過'}
                          {entry.status === 'rejected' && '不選考'}
                        </span>
                        <p className="text-gray-600">
                          {entry.status === 'pending' && '審査をお待ちください'}
                          {entry.status === 'submitted' && '審査中です'}
                          {entry.status === 'selected' && 'おめでとうございます！次のステップの案内をお待ちください。'}
                          {entry.status === 'rejected' && '残念ながら不選考となりました'}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className={`h-16 w-16 ${
                        entry.status === 'selected' ? 'text-green-500' :
                        entry.status === 'rejected' ? 'text-red-500' :
                        entry.status === 'submitted' ? 'text-blue-500' :
                        'text-yellow-500'
                      }`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        {entry.status === 'selected' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : entry.status === 'rejected' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* シード権ユーザー専用の選考状況 */}
          {userProfile.has_seed && (
            <div className="mb-8">
              <div className="bg-green-50 overflow-hidden shadow-lg rounded-lg border-2 border-green-300">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-green-900 mb-2">選考状況</h2>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold bg-green-100 text-green-800">
                          シード権保持
                        </span>
                        <p className="text-green-700">
                          自動的に選考を通過します。エントリー情報を登録してください。
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* エントリー情報カード */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* 基本情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        基本情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {entry ? '登録済み' : '未登録'}
                      </dd>
                      {entry && (
                        <dd className="text-sm text-gray-500 mt-1">
                          {entry.dance_style} {entry.team_name && `• ${entry.team_name}`}
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/dashboard/form" className="font-medium text-indigo-600 hover:text-indigo-500">
                    {entry ? '情報を編集 →' : '情報を登録 →'}
                  </Link>
                </div>
              </div>
            </div>

            {/* ファイルアップロードカード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        ファイルアップロード
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {fileStats.music > 0 || fileStats.video > 0 || fileStats.photo > 0 ? 'アップロード済み' : '未アップロード'}
                      </dd>
                      {(fileStats.music > 0 || fileStats.video > 0 || fileStats.photo > 0) && (
                        <dd className="text-sm text-gray-500 mt-1">
                          音源: {fileStats.music}個 • 動画: {fileStats.video}個 • 写真: {fileStats.photo}個
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/dashboard/form" className="font-medium text-indigo-600 hover:text-indigo-500">
                    ファイルを管理 →
                  </Link>
                </div>
              </div>
            </div>

            {/* 提出状況カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        提出状況
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {entry && entry.status !== 'pending' ? '提出済み' : '未提出'}
                      </dd>
                      {entry && (
                        <dd className="text-sm text-gray-500 mt-1">
                          {entry.status === 'pending' && '必要項目を入力して提出してください'}
                          {entry.status !== 'pending' && '審査をお待ちください'}
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link href="/dashboard/form" className="font-medium text-indigo-600 hover:text-indigo-500">
                    {entry && entry.status !== 'pending' ? '内容を確認 →' : 'エントリーを提出 →'}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* エントリー情報詳細表示 */}
          {entry && (
            <div className="mt-8 space-y-6">
              {/* 基本情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">基本情報</h3>
                    <Link href="/dashboard/form" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      編集
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">ダンスジャンル</label>
                        <p className="mt-1 text-base text-gray-900">{entry.dance_style || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">チーム名／ペア名</label>
                        <p className="mt-1 text-base text-gray-900">{entry.team_name || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">参加者名</label>
                        <p className="mt-1 text-base text-gray-900 whitespace-pre-line">{entry.participant_names || '未設定'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">代表者電話番号</label>
                        <p className="mt-1 text-base text-gray-900">{entry.phone_number || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">緊急連絡先</label>
                        <p className="mt-1 text-base text-gray-900">{entry.emergency_contact || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">楽曲使用</label>
                        <p className="mt-1 text-base text-gray-900">
                          {entry.use_different_songs ? '準決勝・決勝で異なる楽曲を使用' : '準決勝・決勝で同じ楽曲を使用'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 楽曲情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">楽曲情報</h3>
                    <Link href="/dashboard/form" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      編集
                    </Link>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">曲目</label>
                      <p className="mt-1 text-base text-gray-900">{entry.music_title || '未設定'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">振付師</label>
                      <p className="mt-1 text-base text-gray-900">{entry.choreographer || '未設定'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">ストーリー・コンセプト</label>
                      <p className="mt-1 text-base text-gray-900 whitespace-pre-line">{entry.story || '未設定'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* ファイル情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">アップロードファイル</h3>
                    <Link href="/dashboard/form" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      管理
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">音源</p>
                      <p className="text-2xl font-bold text-gray-900">{fileStats.music}</p>
                      <p className="text-xs text-gray-500">ファイル</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">動画</p>
                      <p className="text-2xl font-bold text-gray-900">{fileStats.video}</p>
                      <p className="text-xs text-gray-500">ファイル</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-900">写真</p>
                      <p className="text-2xl font-bold text-gray-900">{fileStats.photo}</p>
                      <p className="text-xs text-gray-500">ファイル</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* フッター */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">問い合わせ</p>
            <p className="font-medium">バルカーカップ事務局</p>
            <p>
              <a 
                href="mailto:c-cloud01@valqua.com" 
                className="text-indigo-600 hover:text-indigo-500"
              >
                c-cloud01@valqua.com
              </a>
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}