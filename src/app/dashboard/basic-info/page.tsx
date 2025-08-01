import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BasicInfoForm from './BasicInfoForm'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

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
            基本情報
          </h1>
        </div>
      </DashboardHeader>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <BasicInfoForm 
                userId={user.id} 
                entryId={entry?.id || null}
                initialData={basicInfo} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}