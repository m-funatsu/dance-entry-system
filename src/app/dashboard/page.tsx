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

  // 基本情報の取得
  let basicInfo = null
  if (entry) {
    const { data } = await supabase
      .from('basic_info')
      .select('*')
      .eq('entry_id', entry.id)
      .single()
    
    basicInfo = data
  }

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

  // システム設定から期限を取得
  const { data: settings } = await supabase
    .from('settings')
    .select('*')

  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>) || {}

  // 期限情報を取得して表示用に整形
  const getDeadlineInfo = (deadline: string | null) => {
    if (!deadline || deadline === '') return null
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // 期限をフォーマット
    const formattedDate = deadlineDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    return {
      date: formattedDate,
      daysLeft: diffDays,
      isExpired: diffDays < 0,
      isUrgent: diffDays >= 0 && diffDays <= 3
    }
  }

  // 期限チェック機能
  const isFormEditable = (deadlineKey: string) => {
    const deadline = getDeadlineInfo(settingsMap[deadlineKey])
    return !deadline || !deadline.isExpired
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
          
          {/* 選考状況セクション（スリム版） */}
          {!userProfile.has_seed && entry && (
            <div className="mb-6">
              <div className={`border-l-4 bg-white shadow rounded-lg p-4 ${
                entry.status === 'selected' ? 'border-green-500' :
                entry.status === 'rejected' ? 'border-red-500' :
                entry.status === 'submitted' ? 'border-blue-500' :
                'border-yellow-500'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">選考状況</h3>
                    <div className="mt-1 flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                      <span className="ml-3 text-sm text-gray-600">
                        {entry.status === 'pending' && '審査をお待ちください'}
                        {entry.status === 'submitted' && '審査中です'}
                        {entry.status === 'selected' && 'おめでとうございます！'}
                        {entry.status === 'rejected' && '残念ながら不選考となりました'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* シード権ユーザー専用の選考状況 */}
          {userProfile.has_seed && (
            <div className="mb-6">
              <div className="border-l-4 border-green-500 bg-green-50 shadow rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-green-700">選考状況</h3>
                    <div className="mt-1 flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        シード権保持
                      </span>
                      <span className="ml-3 text-sm text-green-700">
                        自動的に選考を通過します
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* エントリー情報カード */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
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
                        {basicInfo ? '登録済み' : '未登録'}
                      </dd>
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.basic_info_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  {isFormEditable('basic_info_deadline') ? (
                    <Link href="/dashboard/basic-info" className="font-medium text-indigo-600 hover:text-indigo-500">
                      {basicInfo ? '編集' : '登録'} →
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-400">
                      期限切れ（編集不可）
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 予選情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        予選情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {entry && entry.work_title ? '登録済み' : '未登録'}
                      </dd>
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.music_info_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  {isFormEditable('music_info_deadline') ? (
                    <Link href="/dashboard/preliminary" className="font-medium text-indigo-600 hover:text-indigo-500">
                      {entry && entry.work_title ? '編集' : '登録'} →
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-400">
                      期限切れ（編集不可）
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 参加同意書カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        参加同意書
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {entry && entry.consent_form_submitted ? '提出済み' : '未提出'}
                      </dd>
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.consent_form_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  {isFormEditable('consent_form_deadline') ? (
                    <Link href="/dashboard/consent-form" className="font-medium text-indigo-600 hover:text-indigo-500">
                      {entry && entry.consent_form_submitted ? '確認' : '提出'} →
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-400">
                      期限切れ（編集不可）
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* プログラム掲載用情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-12 w-12 text-pink-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        プログラム掲載用情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {entry && entry.program_info_submitted ? '登録済み' : '未登録'}
                      </dd>
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.program_info_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  {isFormEditable('program_info_deadline') ? (
                    <Link href="/dashboard/program-info" className="font-medium text-indigo-600 hover:text-indigo-500">
                      {entry && entry.program_info_submitted ? '編集' : '登録'} →
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-400">
                      期限切れ（編集不可）
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 準決勝情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        準決勝情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {entry && (entry.music_title || entry.original_artist) ? '登録済み' : '未登録'}
                      </dd>
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.music_info_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  {isFormEditable('music_info_deadline') ? (
                    <Link href="/dashboard/semifinals" className="font-medium text-indigo-600 hover:text-indigo-500">
                      {entry && (entry.music_title || entry.original_artist) ? '編集' : '登録'} →
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-400">
                      期限切れ（編集不可）
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 決勝情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        決勝情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {entry && (entry.final_music_title || entry.final_original_artist) ? '登録済み' : '未登録'}
                      </dd>
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.finals_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  {isFormEditable('finals_deadline') ? (
                    <Link href="/dashboard/finals" className="font-medium text-indigo-600 hover:text-indigo-500">
                      {entry && (entry.final_music_title || entry.final_original_artist) ? '編集' : '登録'} →
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-400">
                      期限切れ（編集不可）
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* SNS情報カード */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        SNS情報
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {entry && (entry.instagram || entry.twitter || entry.facebook) ? '登録済み' : '未登録'}
                      </dd>
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.sns_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  {isFormEditable('sns_deadline') ? (
                    <Link href="/dashboard/sns" className="font-medium text-indigo-600 hover:text-indigo-500">
                      {entry && (entry.instagram || entry.twitter || entry.facebook) ? '編集' : '登録'} →
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-400">
                      期限切れ（編集不可）
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* 任意申請カード */}
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
                        任意申請
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {entry && entry.optional_requests ? '申請あり' : '申請なし'}
                      </dd>
                      {(() => {
                        const deadline = getDeadlineInfo(settingsMap.optional_request_deadline)
                        if (!deadline) return null
                        return (
                          <dd className={`text-xs mt-1 ${
                            deadline.isExpired ? 'text-red-600' :
                            deadline.isUrgent ? 'text-orange-600' :
                            'text-gray-600'
                          }`}>
                            {deadline.isExpired ? 
                              `期限切れ（${deadline.date}）` :
                              `期限: ${deadline.date}まで（残り${deadline.daysLeft}日）`
                            }
                          </dd>
                        )
                      })()}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  {isFormEditable('optional_request_deadline') ? (
                    <Link href="/dashboard/optional-request" className="font-medium text-indigo-600 hover:text-indigo-500">
                      {entry && entry.optional_requests ? '編集' : '申請'} →
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-400">
                      期限切れ（編雈不可）
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* エントリー情報詳細表示 */}
          {entry && (
            <div className="space-y-6">
              {/* 基本情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">基本情報</h3>
                    {isFormEditable('basic_info_deadline') ? (
                      <Link href="/dashboard/basic-info" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        編集
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        期限切れ
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">ダンスジャンル</label>
                        <p className="mt-1 text-base text-gray-900">{basicInfo?.dance_style || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">代表者名</label>
                        <p className="mt-1 text-base text-gray-900">
                          {entry.representative_name || '未設定'}
                          {entry.representative_furigana && (
                            <span className="text-sm text-gray-600">（{entry.representative_furigana}）</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">パートナー名</label>
                        <p className="mt-1 text-base text-gray-900">
                          {entry.partner_name || '未設定'}
                          {entry.partner_furigana && (
                            <span className="text-sm text-gray-600">（{entry.partner_furigana}）</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">振付師</label>
                        <p className="mt-1 text-base text-gray-900">
                          {entry.choreographer || '未設定'}
                          {entry.choreographer_furigana && (
                            <span className="text-sm text-gray-600">（{entry.choreographer_furigana}）</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">代表者メールアドレス</label>
                        <p className="mt-1 text-base text-gray-900">{basicInfo?.representative_email || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">電話番号</label>
                        <p className="mt-1 text-base text-gray-900">{entry.phone_number || '未設定'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">プライバシーポリシー</label>
                        <p className="mt-1 text-base text-gray-900">
                          {entry.privacy_policy_checked ? '同意済み' : '未同意'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 予選情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">予選情報</h3>
                    {isFormEditable('music_info_deadline') ? (
                      <Link href="/dashboard/preliminary" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        編集
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        期限切れ
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">作品タイトル／テーマ</label>
                      <p className="mt-1 text-base text-gray-900">{entry.work_title || '未設定'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">予選動画</label>
                      <p className="mt-1 text-base text-gray-900">
                        {fileStats.video > 0 ? 'アップロード済み' : '未アップロード'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 準決勝情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">準決勝情報</h3>
                    {isFormEditable('music_info_deadline') ? (
                      <Link href="/dashboard/semifinals" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        編集
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        期限切れ
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">準決勝用楽曲</label>
                      <p className="mt-1 text-base text-gray-900">{entry.music_title || '未設定'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">原曲アーティスト</label>
                      <p className="mt-1 text-base text-gray-900">{entry.original_artist || '未設定'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">ストーリー・コンセプト</label>
                      <p className="mt-1 text-base text-gray-900 whitespace-pre-line">{entry.story || '未設定'}</p>
                    </div>
                  </div>
                  
                  {/* ファイル情報表示 */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">アップロードファイル</h4>
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

              {/* 決勝情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">決勝情報</h3>
                    {isFormEditable('finals_deadline') ? (
                      <Link href="/dashboard/finals" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        編集
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        期限切れ
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">決勝用楽曲</label>
                      <p className="mt-1 text-base text-gray-900">{entry.final_music_title || '未設定'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">決勝用原曲アーティスト</label>
                      <p className="mt-1 text-base text-gray-900">{entry.final_original_artist || '未設定'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SNS情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">SNS情報</h3>
                    {isFormEditable('sns_deadline') ? (
                      <Link href="/dashboard/sns" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        編集
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">
                        期限切れ
                      </span>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Instagram</label>
                      <p className="mt-1 text-base text-gray-900">{entry.instagram || '未設定'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Twitter</label>
                      <p className="mt-1 text-base text-gray-900">{entry.twitter || '未設定'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Facebook</label>
                      <p className="mt-1 text-base text-gray-900">{entry.facebook || '未設定'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 任意申請情報表示 */}
              <div className="bg-white shadow rounded-lg">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">任意申請</h3>
                      {isFormEditable('optional_request_deadline') ? (
                        <Link href="/dashboard/optional-request" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                          編集
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-gray-400">
                          期限切れ
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-base text-gray-900 whitespace-pre-line">{entry.optional_requests || '未設定'}</p>
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