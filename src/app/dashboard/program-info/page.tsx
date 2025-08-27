import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProgramInfoForm from '@/components/dashboard/ProgramInfoForm'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { BackButton } from '@/components/dashboard/BackButton'

export default async function ProgramInfoPage() {
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
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={user}>
          <div className="flex items-center">
            <BackButton />
            <h1 className="text-2xl font-bold text-gray-900">
              プログラム掲載用情報
            </h1>
          </div>
        </DashboardHeader>
        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <p className="text-gray-600">
              エントリー情報が見つかりません。まず基本情報を登録してください。
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user}>
        <div className="flex items-center">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">
            プログラム掲載用情報
          </h1>
        </div>
      </DashboardHeader>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <ProgramInfoForm entry={entry} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}