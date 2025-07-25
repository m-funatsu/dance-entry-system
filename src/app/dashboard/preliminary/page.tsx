import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PreliminaryForm from './PreliminaryForm'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

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
    .single()

  // ファイル情報の取得（予選動画のみ）
  const { data: files } = await supabase
    .from('entry_files')
    .select('*')
    .eq('entry_id', entry.id)
    .eq('file_type', 'video')
    .eq('purpose', 'preliminary')
    .order('uploaded_at', { ascending: false })
    .limit(1)

  const preliminaryVideo = files && files.length > 0 ? files[0] : null

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
            予選情報
          </h1>
        </div>
      </DashboardHeader>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <PreliminaryForm 
                entryId={entry.id}
                initialData={preliminaryInfo}
                preliminaryVideo={preliminaryVideo}
                userId={user.id} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}