import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BasicInfoForm from './BasicInfoForm'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { BackButton } from '@/components/dashboard/BackButton'
import { isFormEditable, getDeadlineInfo } from '@/lib/deadline-check'

// 動的レンダリングを強制（編集時の確実なデータ再取得のため）
export const dynamic = 'force-dynamic'

export default async function BasicInfoPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // エントリー情報の取得
  const { data: entries } = await supabase
    .from('entries')
    .select('id')
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
      .maybeSingle()
    
    basicInfo = data
  }

  // 期限チェック
  const basicInfoEditable = await isFormEditable('basic_info_deadline')
  
  // 期限情報を取得（エラーメッセージ用）
  const supabase2 = await createClient()
  const { data: settings } = await supabase2.from('settings').select('*')
  const settingsMap = settings?.reduce((acc, setting) => {
    acc[setting.key] = setting.value
    return acc
  }, {} as Record<string, string>) || {}
  const deadlineInfo = await getDeadlineInfo(settingsMap['basic_info_deadline'])

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user}>
        <div className="flex items-center">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">
            基本情報
          </h1>
        </div>
      </DashboardHeader>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              {!basicInfoEditable ? (
                <div className="text-center py-12">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-red-800 mb-2">入力期限切れ</h3>
                    <p className="text-red-700">
                      基本情報の入力期限が過ぎているため、編集できません。
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      期限: {deadlineInfo?.date}
                    </p>
                  </div>
                </div>
              ) : (
                <BasicInfoForm 
                  userId={user.id} 
                  entryId={entry?.id || null}
                  initialData={basicInfo} 
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}