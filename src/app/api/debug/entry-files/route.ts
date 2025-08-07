import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const adminSupabase = createAdminClient()
  
  try {
    // entry_filesテーブルのカラム情報を取得
    const { data: columns, error: columnsError } = await adminSupabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'entry_files')
      .order('ordinal_position')
    
    // entry_filesテーブルのデータを取得（最新10件）
    const { data: entries, error: entriesError } = await adminSupabase
      .from('entry_files')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    // 音楽ファイルのデータを取得
    const { data: musicFiles, error: musicError } = await adminSupabase
      .from('entry_files')
      .select('*')
      .eq('file_type', 'music')
      .order('created_at', { ascending: false })
      .limit(10)
    
    return NextResponse.json({
      columns: columns || [],
      columnsError,
      entries: entries || [],
      entriesError,
      musicFiles: musicFiles || [],
      musicError,
      totalEntries: entries?.length || 0,
      totalMusicFiles: musicFiles?.length || 0
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}