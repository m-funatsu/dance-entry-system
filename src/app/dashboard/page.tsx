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
          <div className={`grid grid-cols-1 gap-6 ${userProfile.has_seed ? 'md:grid-cols-2' : 'md:grid-cols-1 lg:grid-cols-2'}`}>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        エントリー情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {entry ? '登録済み' : '情報を登録'}
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
                  <a href="/dashboard/form" className="font-medium text-indigo-600 hover:text-indigo-500">
                    {entry ? 'エントリー情報を編集 →' : 'エントリー情報を登録 →'}
                  </a>
                </div>
              </div>
            </div>

            {/* 選考状況カード - シード権ユーザーには非表示 */}
            {!userProfile.has_seed && entry && (
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          選考状況
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {entry.status === 'pending' && '審査待ち'}
                          {entry.status === 'submitted' && '提出済み'}
                          {entry.status === 'selected' && '選考通過'}
                          {entry.status === 'rejected' && '不選考'}
                        </dd>
                        <dd className="text-sm text-gray-500 mt-1">
                          {entry.status === 'pending' && '審査をお待ちください'}
                          {entry.status === 'submitted' && '審査中です'}
                          {entry.status === 'selected' && 'おめでとうございます！'}
                          {entry.status === 'rejected' && '残念ながら不選考となりました'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* シード権ユーザー専用の情報カード */}
            {userProfile.has_seed && (
              <div className="bg-green-50 overflow-hidden shadow rounded-lg border border-green-200">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-green-700 truncate">
                          シード権
                        </dt>
                        <dd className="text-lg font-medium text-green-900">
                          選考免除
                        </dd>
                        <dd className="text-sm text-green-600 mt-1">
                          自動的に選考を通過します
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* エントリー情報詳細表示 */}
          {entry && (
            <div className="mt-8 space-y-6">
              {/* 基本情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">基本情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {entry.photo_url && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">写真</label>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.photo_url}
                          alt="登録写真"
                          className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700">ダンスジャンル</label>
                        <p className="mt-1 text-sm text-gray-900">{entry.dance_style || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700">ペア名</label>
                        <p className="mt-1 text-sm text-gray-900">{entry.team_name || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700">参加者名</label>
                        <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{entry.participant_names || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700">電話番号</label>
                        <p className="mt-1 text-sm text-gray-900">{entry.phone_number || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700">緊急連絡先</label>
                        <p className="mt-1 text-sm text-gray-900">{entry.emergency_contact || '未設定'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 楽曲情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">楽曲情報</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700">曲目</label>
                      <p className="mt-1 text-sm text-gray-900">{entry.music_title || '未設定'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700">振付師</label>
                      <p className="mt-1 text-sm text-gray-900">{entry.choreographer || '未設定'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700">ストーリー</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{entry.story || '未設定'}</p>
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