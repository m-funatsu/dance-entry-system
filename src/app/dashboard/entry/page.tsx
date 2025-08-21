import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EntryForm from './EntryForm'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { BackButton } from '@/components/dashboard/BackButton'

export default async function EntryPage() {
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

  // 最新のエントリーを1件取得（複数ある場合は最新のもの）
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const existingEntry = entries && entries.length > 0 ? entries[0] : null


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
            基本情報
          </h1>
        </div>
      </DashboardHeader>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {existingEntry ? '基本情報の編集' : '基本情報の入力'}
              </h2>
              <EntryForm 
                userId={user.id}
                existingEntry={existingEntry}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}