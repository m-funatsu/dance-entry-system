import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IntegratedEntryForm from './IntegratedEntryForm'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { BackButton } from '@/components/dashboard/BackButton'

export default async function FormPage() {
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

  // 最新のエントリーを取得
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const existingEntry = entries && entries.length > 0 ? entries[0] : null

  // ファイル情報も取得
  const { data: files } = existingEntry ? await supabase
    .from('entry_files')
    .select('*')
    .eq('entry_id', existingEntry.id) : { data: [] }

  return (
    <div className="min-h-screen bg-gray-50" style={{
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), var(--entry-bg-image, none)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      <DashboardHeader user={user}>
        <div className="flex items-center">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900">
            エントリー情報登録
          </h1>
        </div>
      </DashboardHeader>

      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <IntegratedEntryForm 
            userId={user.id}
            existingEntry={existingEntry}
            existingFiles={files || []}
            userProfile={userProfile}
          />
        </div>
      </main>
    </div>
  )
}