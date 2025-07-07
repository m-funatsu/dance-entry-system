'use client'

import Link from 'next/link'
import BackgroundLoader from '@/components/BackgroundLoader'

interface User {
  id: string
  name: string
  email: string
  role: string
  has_seed?: boolean
}

interface Entry {
  id: string
  user_id: string
  dance_style: string
  team_name?: string
  participant_names: string
  phone_number: string
  emergency_contact: string
  photo_url?: string
  music_title?: string
  choreographer?: string
  story?: string
  status: string
}

interface MusicInfo {
  id: string
  user_id: string
  music_title: string
  choreographer?: string
  story?: string
}

interface EntryFile {
  id: string
  entry_id: string
  file_type: string
  file_name: string
  file_path: string
}

interface DashboardContentProps {
  userProfile: User
  entry: Entry | null
  musicInfo: MusicInfo | null
  entryFiles: EntryFile[]
}

export default function DashboardContent({ userProfile, entry, musicInfo, entryFiles }: DashboardContentProps) {
  return (
    <>
      <BackgroundLoader pageType="dashboard" />
      <div className="min-h-screen bg-gray-50" style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), var(--dashboard-bg-image, none)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
        <header className="bg-white bg-opacity-95 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-indigo-600 hover:text-indigo-900">
                  <h1 className="text-2xl font-bold text-gray-900">
                    2025 バルカーカップ•ジャパンオープン•ショーダンス選手権
                  </h1>
                </Link>
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
            <div className="bg-white bg-opacity-95 shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  エントリー状況
                </h2>

                {/* 基本情報セクション */}
                <div className="bg-white rounded-lg p-6 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          基本情報
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {entry ? '登録済み' : '基本情報を登録'}
                        </dd>
                        {entry && (
                          <dd className="text-sm text-gray-500 mt-1">
                            {entry.dance_style} {entry.team_name && `• ${entry.team_name}`}
                          </dd>
                        )}
                      </dl>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <Link href="/dashboard/entry">
                        <span className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                          {entry ? '編集' : '登録'}
                        </span>
                      </Link>
                    </div>
                  </div>

                  {entry && (
                    <div className="mt-4 text-sm text-gray-600 space-y-1">
                      <p><strong>参加者名:</strong> {entry.participant_names}</p>
                      <p><strong>電話番号:</strong> {entry.phone_number}</p>
                      <p><strong>緊急連絡先:</strong> {entry.emergency_contact}</p>
                      {entry.photo_url && (
                        <p><strong>写真:</strong> アップロード済み</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 楽曲情報セクション */}
                <div className="bg-white rounded-lg p-6 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          楽曲情報
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {musicInfo ? '登録済み' : '楽曲情報を登録'}
                        </dd>
                        {musicInfo && (
                          <dd className="text-sm text-gray-500 mt-1">
                            {musicInfo.music_title} {musicInfo.choreographer && `• 振付: ${musicInfo.choreographer}`}
                          </dd>
                        )}
                      </dl>
                    </div>
                    <div className="ml-5 flex-shrink-0">
                      <Link href="/dashboard/music">
                        <span className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                          {musicInfo ? '編集' : '登録'}
                        </span>
                      </Link>
                    </div>
                  </div>

                  {musicInfo && (
                    <div className="mt-4 text-sm text-gray-600 space-y-1">
                      <p><strong>楽曲タイトル:</strong> {musicInfo.music_title}</p>
                      {musicInfo.choreographer && <p><strong>振付師:</strong> {musicInfo.choreographer}</p>}
                      {musicInfo.story && (
                        <div>
                          <p><strong>ストーリー:</strong></p>
                          <p className="pl-4 italic">{musicInfo.story}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ファイルアップロード状況 */}
                <div className="bg-white rounded-lg p-6 mb-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">アップロードファイル</h3>
                  <div className="space-y-2">
                    {entryFiles.length > 0 ? (
                      entryFiles.map((file) => (
                        <div key={file.id} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <span className="text-sm font-medium">{file.file_name}</span>
                            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {file.file_type}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">まだファイルがアップロードされていません</p>
                    )}
                  </div>
                  <div className="mt-4">
                    <Link href="/dashboard/upload">
                      <span className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        ファイルをアップロード
                      </span>
                    </Link>
                  </div>
                </div>

                {/* 選考状況 */}
                {userProfile.has_seed ? (
                  <div className="bg-green-50 rounded-lg p-6 mb-6">
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
                ) : (
                  <div className="bg-yellow-50 rounded-lg p-6 mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-yellow-800 truncate">
                            選考状況
                          </dt>
                          <dd className="text-lg font-medium text-yellow-900">
                            {entry?.status === 'pending' && '審査中'}
                            {entry?.status === 'submitted' && '提出済み'}
                            {entry?.status === 'selected' && '選考通過'}
                            {entry?.status === 'rejected' && '選考外'}
                            {!entry?.status && '未提出'}
                          </dd>
                          <dd className="text-sm text-yellow-700 mt-1">
                            選考結果をお待ちください
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-white bg-opacity-95 shadow mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-600">
              <h3 className="font-medium mb-2">お問い合わせ</h3>
              <p>運営事務局: info@example.com</p>
              <p>電話: 03-1234-5678（平日 10:00-18:00）</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}