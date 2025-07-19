import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCSVTemplate, generateCSVWithBOM } from '@/lib/csv-template'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // CSVテンプレートを生成
    const csvContent = generateCSVTemplate()
    const csvData = generateCSVWithBOM(csvContent)

    // レスポンスヘッダーを設定
    const headers = new Headers()
    headers.set('Content-Type', 'text/csv; charset=utf-8')
    headers.set('Content-Disposition', 'attachment; filename="entry_template.csv"')
    headers.set('Cache-Control', 'no-cache')

    return new NextResponse(csvData, { headers })
  } catch (error) {
    console.error('CSVテンプレート生成エラー:', error)
    return NextResponse.json(
      { error: 'CSVテンプレートの生成に失敗しました' },
      { status: 500 }
    )
  }
}