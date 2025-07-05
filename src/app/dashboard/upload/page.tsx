import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDateLocale } from '@/lib/utils'
import UploadManager from './UploadManager'

export default async function UploadPage() {
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

  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .in('key', ['upload_deadline', 'max_file_size_mb', 'allowed_video_formats', 'allowed_audio_formats', 'allowed_image_formats'])

  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>) || {}

  const deadline = settingsMap.upload_deadline ? new Date(settingsMap.upload_deadline) : null
  const isDeadlinePassed = deadline ? new Date() > deadline : false

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-900">
                ← ダッシュボードに戻る
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                ファイルアップロード
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

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {deadline && (
            <div className={`mb-6 rounded-md p-4 ${isDeadlinePassed ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className={`h-5 w-5 ${isDeadlinePassed ? 'text-red-400' : 'text-yellow-400'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${isDeadlinePassed ? 'text-red-800' : 'text-yellow-800'}`}>
                    {isDeadlinePassed ? 'アップロード期限を過ぎています' : 'アップロード期限'}
                  </p>
                  <p className={`text-sm ${isDeadlinePassed ? 'text-red-700' : 'text-yellow-700'}`}>
                    期限: {formatDateLocale(deadline.toISOString())}
                    {isDeadlinePassed && ' - 新しいファイルのアップロードはできません'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <UploadManager 
            userId={user.id}
            entryId={entry.id}
            isDeadlinePassed={isDeadlinePassed}
            settings={settingsMap}
          />
        </div>
      </main>
    </div>
  )
}