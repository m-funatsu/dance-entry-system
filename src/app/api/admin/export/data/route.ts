import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 管理者権限チェック
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const adminSupabase = createAdminClient()

    // 全データを取得
    const [usersResult, entriesResult, entryFilesResult, selectionsResult, settingsResult] = await Promise.all([
      adminSupabase.from('users').select('*').order('created_at'),
      adminSupabase.from('entries').select('*').order('created_at'),
      adminSupabase.from('entry_files').select('*').order('uploaded_at'),
      adminSupabase.from('selections').select('*').order('created_at'),
      adminSupabase.from('settings').select('*').order('key')
    ])

    if (usersResult.error || entriesResult.error || entryFilesResult.error || selectionsResult.error || settingsResult.error) {
      throw new Error('Failed to fetch data from database')
    }

    const users = usersResult.data || []
    const entries = entriesResult.data || []
    const entryFiles = entryFilesResult.data || []
    const selections = selectionsResult.data || []
    const settings = settingsResult.data || []

    // CSVヘルパー関数
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    }

    const arrayToCSV = (data: any[], headers: string[]): string => {
      const headerRow = headers.map(escapeCSV).join(',')
      const dataRows = data.map(row => 
        headers.map(header => escapeCSV(row[header])).join(',')
      )
      return [headerRow, ...dataRows].join('\n')
    }

    // 各テーブルのCSVデータを生成
    const usersCSV = arrayToCSV(users, ['id', 'email', 'name', 'role', 'created_at', 'updated_at'])
    const entriesCSV = arrayToCSV(entries, [
      'id', 'user_id', 'dance_style', 'team_name', 'participant_names', 
      'phone_number', 'emergency_contact', 'photo_url', 'music_title', 
      'choreographer', 'story', 'status', 'created_at', 'updated_at'
    ])
    const entryFilesCSV = arrayToCSV(entryFiles, [
      'id', 'entry_id', 'file_type', 'file_name', 'file_path', 
      'file_size', 'mime_type', 'uploaded_at'
    ])
    const selectionsCSV = arrayToCSV(selections, [
      'id', 'entry_id', 'admin_id', 'score', 'comments', 
      'status', 'created_at', 'updated_at'
    ])
    const settingsCSV = arrayToCSV(settings, [
      'id', 'key', 'value', 'description', 'created_at', 'updated_at'
    ])

    // 統合CSVデータを作成
    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        exported_by: user.id,
        total_users: users.length,
        total_entries: entries.length,
        total_files: entryFiles.length,
        total_selections: selections.length,
        total_settings: settings.length
      },
      users: usersCSV,
      entries: entriesCSV,
      entry_files: entryFilesCSV,
      selections: selectionsCSV,
      settings: settingsCSV
    }

    // URL SearchParamsでフォーマットを指定可能
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    if (format === 'csv') {
      // 統合CSVファイルを生成
      let combinedCSV = `# ダンスエントリーシステム データエクスポート\n`
      combinedCSV += `# エクスポート日時: ${exportData.export_info.exported_at}\n`
      combinedCSV += `# エクスポート実行者: ${user.id}\n`
      combinedCSV += `\n# === USERS (${users.length}件) ===\n`
      combinedCSV += usersCSV
      combinedCSV += `\n\n# === ENTRIES (${entries.length}件) ===\n`
      combinedCSV += entriesCSV
      combinedCSV += `\n\n# === ENTRY_FILES (${entryFiles.length}件) ===\n`
      combinedCSV += entryFilesCSV
      combinedCSV += `\n\n# === SELECTIONS (${selections.length}件) ===\n`
      combinedCSV += selectionsCSV
      combinedCSV += `\n\n# === SETTINGS (${settings.length}件) ===\n`
      combinedCSV += settingsCSV

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
      
      return new NextResponse(combinedCSV, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="dance_entry_data_${timestamp}.csv"`,
          'Cache-Control': 'no-cache',
        }
      })
    }

    // JSON形式でレスポンス（デフォルト）
    return NextResponse.json(exportData, {
      headers: {
        'Cache-Control': 'no-cache',
      }
    })

  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}