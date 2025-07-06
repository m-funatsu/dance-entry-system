import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import MessageAlert from '@/components/MessageAlert'
import DashboardContent from '@/components/DashboardContent'

export default async function DashboardPage() {
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

  // ユーザーのエントリー情報を取得
  const { data: entry } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // 楽曲情報を取得
  const { data: musicInfo } = await supabase
    .from('music_info')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // エントリーファイルを取得
  const { data: entryFiles } = await supabase
    .from('entry_files')
    .select('*')
    .eq('entry_id', entry?.id || '')

  return (
    <>
      <Suspense fallback={null}>
        <MessageAlert />
      </Suspense>
      <DashboardContent 
        userProfile={userProfile} 
        entry={entry} 
        musicInfo={musicInfo} 
        entryFiles={entryFiles || []} 
      />
    </>
  )
}