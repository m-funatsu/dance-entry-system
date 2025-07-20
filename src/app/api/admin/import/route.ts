import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Google FormのCSVヘッダーとデータベースフィールドのマッピング
const FIELD_MAPPING: Record<string, string> = {
  'タイムスタンプ': 'timestamp',
  '●出場ジャンル（一つ選択）': 'dance_style',
  '■ペア情報　代表者 【氏名　漢字】': 'representative_name',
  '■ペア情報　代表者 【氏名　フリガナ】': 'representative_furigana',
  '■ペア情報　代表者 【メールアドレス】': 'email',
  '■ペア情報　代表者 【電話番号】': 'phone_number',
  '■ペア情報　パートナー 【氏名　漢字】': 'partner_name',
  '■ペア情報　パートナー 【氏名　フリガナ】': 'partner_furigana',
  '■ 振付師情報【氏名　漢字】': 'choreographer',
  '■ 振付師情報【氏名　フリガナ】': 'choreographer_furigana',
  '●ペア参加資格および参加者情報の内容について': 'agreement_status',
  'プライバシーポリシー ※上記よりご確認ください。': 'privacy_policy_status'
}

// ヘッダーの正規化（空白の違いを吸収）
function normalizeHeader(header: string): string {
  return header.trim().replace(/\s+/g, ' ')
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    // ファイルの取得
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
    }

    // CSVの読み込み（BOMを削除）
    const buffer = await file.arrayBuffer()
    const decoder = new TextDecoder('utf-8')
    let text = decoder.decode(buffer)
    
    // BOMを削除
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1)
    }
    
    // 改行コードを統一
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    
    // 複数行ヘッダーを処理
    const { headers: rawHeaders, dataLines } = parseCSVWithMultilineHeaders(text)
    
    if (dataLines.length === 0) {
      return NextResponse.json({ error: 'CSVファイルにデータがありません' }, { status: 400 })
    }

    // ヘッダーの正規化
    const headers = rawHeaders.map(h => normalizeHeader(h))
    console.log('Headers:', headers)
    console.log('First data line:', dataLines[0])
    
    // 正規化されたマッピングを作成
    const normalizedMapping: Record<string, string> = {}
    Object.entries(FIELD_MAPPING).forEach(([key, value]) => {
      normalizedMapping[normalizeHeader(key)] = value
    })
    
    // ヘッダーのマッピング確認
    const mappedHeaders = headers.map(h => normalizedMapping[h] || null)
    console.log('Mapped headers:', mappedHeaders)

    // 管理者クライアントを使用（RLS回避）
    const adminSupabase = createAdminClient()
    
    const results = {
      success: 0,
      errors: [] as string[],
      created: [] as string[]
    }

    // データ行の処理
    for (let i = 0; i < dataLines.length; i++) {
      const values = parseCSVLine(dataLines[i])
      if (values.length === 0) continue

      try {
        // データのマッピング
        const mappedData: Record<string, string> = {}
        headers.forEach((header, index) => {
          const dbField = normalizedMapping[header]
          if (dbField && values[index]) {
            mappedData[dbField] = values[index].trim()
          }
        })

        console.log(`Row ${i + 1} mapped data:`, mappedData)

        // 必須フィールドのチェック
        if (!mappedData.email || !mappedData.representative_name || !mappedData.dance_style) {
          console.log(`Row ${i + 1} missing required fields:`, {
            email: mappedData.email,
            representative_name: mappedData.representative_name,
            dance_style: mappedData.dance_style
          })
          results.errors.push(`行 ${i + 1}: 必須フィールド（メールアドレス、代表者名、ダンスジャンル）が不足しています`)
          continue
        }

        // メールアドレスの重複チェック
        const { data: existingUser } = await adminSupabase
          .from('users')
          .select('id, email')
          .eq('email', mappedData.email)
          .single()

        if (existingUser) {
          results.errors.push(`行 ${i + 1}: メールアドレス ${mappedData.email} は既に登録されています`)
          continue
        }

        // ユーザーの作成
        const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
          email: mappedData.email,
          password: Math.random().toString(36).slice(-12), // ランダムなパスワード
          email_confirm: true
        })

        if (authError) {
          console.error('Auth error:', authError)
          results.errors.push(`行 ${i + 1}: ユーザー作成エラー: ${authError.message}`)
          continue
        }

        if (!authData.user) {
          results.errors.push(`行 ${i + 1}: ユーザー作成に失敗しました`)
          continue
        }

        // usersテーブルに追加
        const { error: userError } = await adminSupabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: mappedData.email,
            name: mappedData.representative_name,
            role: 'participant'
          })

        if (userError) {
          console.error('User table error:', userError)
          // Authユーザーを削除
          await adminSupabase.auth.admin.deleteUser(authData.user.id)
          results.errors.push(`行 ${i + 1}: ユーザー情報の保存エラー: ${userError.message}`)
          continue
        }

        // エントリーの作成
        const entryData = {
          user_id: authData.user.id,
          dance_style: mappedData.dance_style,
          representative_name: mappedData.representative_name,
          representative_furigana: mappedData.representative_furigana || '',
          partner_name: mappedData.partner_name || '',
          partner_furigana: mappedData.partner_furigana || '',
          phone_number: mappedData.phone_number || '',
          choreographer: mappedData.choreographer || '',
          choreographer_furigana: mappedData.choreographer_furigana || '',
          status: 'pending' as const,
          agreement_checked: mappedData.agreement_status === '理解した',
          google_form_data: {
            timestamp: mappedData.timestamp,
            imported_at: new Date().toISOString(),
            privacy_policy: mappedData.privacy_policy_status
          }
        }

        const { error: entryError } = await adminSupabase
          .from('entries')
          .insert(entryData)

        if (entryError) {
          console.error('Entry error:', entryError)
          results.errors.push(`行 ${i + 1}: エントリー作成エラー: ${entryError.message}`)
          continue
        }

        results.success++
        results.created.push(`${mappedData.representative_name} (${mappedData.email})`)

        // パスワードリセットメールを送信
        const { error: resetError } = await adminSupabase.auth.resetPasswordForEmail(
          mappedData.email,
          {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`
          }
        )

        if (resetError) {
          console.error('Password reset error:', resetError)
        }

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        results.errors.push(`行 ${i + 1}: 処理中にエラーが発生しました`)
      }
    }

    // デバッグ情報を含める
    if (results.success === 0 && results.errors.length === 0) {
      return NextResponse.json({
        error: '有効なインポートデータが見つかりませんでした',
        details: [
          `ヘッダー: ${headers.join(', ')}`,
          `データ行数: ${dataLines.length}`,
          '※CSVファイルの形式を確認してください'
        ]
      }, { status: 400 })
    }

    return NextResponse.json({
      message: `${results.success}件のエントリーをインポートしました`,
      details: [
        ...results.created.map(name => `✓ ${name} を作成しました`),
        ...results.errors
      ]
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'インポート処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

// CSV行を解析（ダブルクォート対応）
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"' && !inQuotes) {
      inQuotes = true
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"'
        i++ // ダブルクォートをスキップ
      } else {
        inQuotes = false
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

// 複数行にまたがるヘッダーを処理
function parseCSVWithMultilineHeaders(text: string): { headers: string[], dataLines: string[] } {
  const lines = text.split('\n')
  let headerLine = ''
  let dataStartIndex = 0
  
  // ヘッダー行を特定（最初のタイムスタンプ形式の行まで）
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.match(/^\d{4}\/\d{2}\/\d{2}/)) {
      // データ行を発見
      dataStartIndex = i
      break
    }
    headerLine += (headerLine ? '\n' : '') + line
  }
  
  // ヘッダーを解析（改行を削除）
  const headers = parseCSVLine(headerLine.replace(/\n/g, ' '))
  const dataLines = lines.slice(dataStartIndex).filter(line => line.trim())
  
  return { headers, dataLines }
}