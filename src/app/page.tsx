import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!userProfile) {
    console.log('新規認証ユーザー - プロフィール作成が必要:', user.id)
    
    // 新規ユーザーのプロフィール作成
    const { error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー',
        role: 'participant'
      })
    
    if (createError) {
      console.error('プロフィール作成エラー:', createError)
      redirect('/auth/login')
    } else {
      console.log('プロフィール作成完了 - ダッシュボードへ')
      redirect('/dashboard')
    }
    return
  }

  if (userProfile.role === 'admin') {
    redirect('/admin/dashboard')
  } else {
    redirect('/dashboard')
  }
}