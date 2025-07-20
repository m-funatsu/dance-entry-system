import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    
    // 行に分割
    const lines = text.split('\n')
    
    // 最初の10行を詳細に分析
    const analysis = {
      totalLines: lines.length,
      nonEmptyLines: lines.filter(l => l.trim()).length,
      firstTenLines: lines.slice(0, 10).map((line, index) => ({
        lineNumber: index + 1,
        content: line,
        length: line.length,
        isEmpty: !line.trim(),
        hasTimestamp: /^\d{4}\/\d{2}\/\d{2}/.test(line.trim()),
        commaCount: (line.match(/,/g) || []).length
      })),
      headers: [] as string[],
      dataLines: [] as { lineNumber: number; values: string[]; valueCount: number }[]
    }
    
    // ヘッダーを探す
    let headerEndIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (/^\d{4}\/\d{2}\/\d{2}/.test(lines[i].trim())) {
        headerEndIndex = i
        break
      }
    }
    
    if (headerEndIndex > 0) {
      // ヘッダーを結合して解析
      const headerText = lines.slice(0, headerEndIndex).join(' ')
      analysis.headers = parseCSVLine(headerText)
      
      // データ行を解析（最初の5行まで）
      for (let i = headerEndIndex; i < Math.min(headerEndIndex + 5, lines.length); i++) {
        const line = lines[i].trim()
        if (line) {
          const values = parseCSVLine(line)
          analysis.dataLines.push({
            lineNumber: i + 1,
            values: values,
            valueCount: values.length
          })
        }
      }
    }
    
    return NextResponse.json({
      message: 'CSV分析結果',
      analysis: analysis,
      debug: {
        fileSize: file.size,
        fileName: file.name,
        fileType: file.type,
        bomDetected: text.charCodeAt(0) === 0xFEFF
      }
    })

  } catch (error) {
    console.error('Test import error:', error)
    return NextResponse.json(
      { error: 'テストインポート中にエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
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