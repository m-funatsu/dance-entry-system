import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ApplicationsForm from '@/components/dashboard/ApplicationsForm'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

export default async function ApplicationsPage() {
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
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 mr-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              各種申請
            </h1>
          </div>
        </DashboardHeader>
        <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <p className="text-gray-600">
              エントリー情報が見つかりません。まず基本情報を登録してください。
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user}>
        <div className="flex items-center">
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 mr-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            各種申請
          </h1>
        </div>
      </DashboardHeader>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <ApplicationsForm entry={entry} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}