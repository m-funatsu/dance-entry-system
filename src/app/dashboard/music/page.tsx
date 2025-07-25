import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MusicInfoForm from './MusicInfoForm'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

export default async function MusicPage() {
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

  if (userProfile.role !== 'participant') {
    redirect('/admin/dashboard')
  }

  const { data: entry } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!entry) {
    redirect('/dashboard/entry?message=先に基本情報を入力してください')
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), var(--music-bg-image, none)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      <DashboardHeader user={user}>
        <div className="flex items-center">
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 mr-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            楽曲情報
          </h1>
        </div>
      </DashboardHeader>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                楽曲情報の入力
              </h2>
              <MusicInfoForm 
                userId={user.id}
                entryId={entry.id}
                existingEntry={entry}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}