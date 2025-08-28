import { NextResponse } from 'next/server'

export async function GET() {
  // 開発環境でのみデバッグ情報を表示
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (!isDevelopment) {
    return NextResponse.json({ error: 'Debug endpoint is only available in development' }, { status: 403 })
  }

  const envDebug = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定済み' : '未設定',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '設定済み' : '未設定',
    SUPABASE_SERVICE_ROLE_KEY_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    SUPABASE_SERVICE_ROLE_KEY_first10: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) || 'なし',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  }

  return NextResponse.json(envDebug)
}