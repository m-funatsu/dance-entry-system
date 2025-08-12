import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SeatRequestForm from './SeatRequestForm'

export default async function SeatRequestPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // ユーザー情報を取得
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!userData) {
    redirect('/auth/login')
  }

  // エントリー情報を取得
  const { data: entry } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // 既存の観覧席希望申請データを取得
  let seatRequest = null
  if (entry) {
    const { data } = await supabase
      .from('seat_request')
      .select('*')
      .eq('entry_id', entry.id)
      .single()
    seatRequest = data
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">観覧席希望申請</h1>
          <SeatRequestForm 
            userId={user.id}
            entryId={entry?.id || null}
            initialData={seatRequest}
          />
        </div>
      </div>
    </div>
  )
}