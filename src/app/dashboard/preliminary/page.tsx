import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PreliminaryForm from './PreliminaryForm'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { BackButton } from '@/components/dashboard/BackButton'
import { isFormEditable, getDeadlineInfo } from '@/lib/deadline-check'

// 動的レンダリングを強制（編集時の確実なデータ再取得のため）
export const dynamic = 'force-dynamic'

export default async function PreliminaryPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // エントリー情報の取得
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const entry = entries && entries.length > 0 ? entries[0] : null

  if (!entry) {
    redirect('/dashboard/basic-info')
  }

  // 予選情報の取得
  const { data: preliminaryInfo } = await supabase
    .from('preliminary_info')
    .select('*')
    .eq('entry_id', entry.id)
    .maybeSingle()

  // ファイル情報の取得（予選動画のみ）
  const { data: files } = await supabase
    .from('entry_files')
    .select('*')
    .eq('entry_id', entry.id)
    .eq('file_type', 'video')
    .eq('purpose', 'preliminary')
    .order('uploaded_at', { ascending: false })

  const preliminaryVideo = files && files.length > 0 ? files[0] : null

  // 期限チェック
  const musicInfoEditable = await isFormEditable('music_info_deadline')
  
  // 期限情報を取得（エラーメッセージ用）
  const supabase2 = await createClient()
  const { data: settings } = await supabase2.from('settings').select('*')
  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>) || {}
  const deadlineInfo = await getDeadlineInfo(settingsMap['music_info_deadline'])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user}>
        <div className="flex items-center">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">
            予選情報
          </h1>
        </div>
      </DashboardHeader>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {!musicInfoEditable && (
                <div className="mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-800 mb-1">入力期限切れ</h3>
                    <p className="text-sm text-red-700">
                      予選情報の入力期限が過ぎているため、編集できません。期限: {deadlineInfo?.date}
                    </p>
                  </div>
                </div>
              )}
              <PreliminaryForm 
                entryId={entry.id}
                initialData={preliminaryInfo}
                preliminaryVideo={preliminaryVideo}
                userId={user.id}
                isEditable={musicInfoEditable}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}