import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const adminSupabase = createAdminClient()
  
  try {
    // テーブル一覧を取得
    const { data: tables, error: tablesError } = await adminSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name')
    
    // section_deadlinesテーブルの詳細を取得
    const { data: sectionDeadlines, error: sectionError } = await adminSupabase
      .from('section_deadlines')
      .select('*')
    
    // admin_settingsテーブルの詳細を取得（存在する場合）
    const { data: adminSettings, error: adminError } = await adminSupabase
      .from('admin_settings')
      .select('*')
    
    return NextResponse.json({
      tables: tables || [],
      tablesError,
      sectionDeadlines: sectionDeadlines || [],
      sectionError,
      adminSettings: adminSettings || [],
      adminError,
      hasSection: tables?.some(t => t.table_name === 'section_deadlines'),
      hasAdmin: tables?.some(t => t.table_name === 'admin_settings')
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}