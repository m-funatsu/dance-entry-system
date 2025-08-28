import { createClient } from '@supabase/supabase-js'

// 管理者用Supabaseクライアント（Service Roleキー使用）
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // デバッグ情報（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('Admin Client Debug:', {
      NODE_ENV: process.env.NODE_ENV,
      supabaseUrl: supabaseUrl ? '設定済み' : '未設定',
      supabaseServiceKey: supabaseServiceKey ? '設定済み' : '未設定',
      serviceKeyLength: supabaseServiceKey?.length || 0,
      serviceKeyPrefix: supabaseServiceKey?.substring(0, 10) || 'なし'
    })
  }

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}