import { Entry } from './types'

export interface EntryWithUser extends Entry {
  users?: {
    id?: string
    name?: string
    email?: string
    role?: string
    created_at?: string
    updated_at?: string
  }
}

// CSVヘッダーの定義（カテゴリ付き）
export const CSV_HEADERS = [
  { key: 'id', label: 'エントリーID', category: '基本情報' },
  { key: 'user_name', label: 'ユーザー名', category: '基本情報' },
  { key: 'user_email', label: 'メールアドレス', category: '基本情報' },
  { key: 'dance_style', label: 'ダンスジャンル', category: '基本情報' },
  { key: 'phone_number', label: '電話番号', category: '基本情報' },
  { key: 'music_title', label: '曲名', category: '作品情報' },
  { key: 'choreographer', label: '振付師', category: '作品情報' },
  { key: 'choreographer_furigana', label: '振付師フリガナ', category: '作品情報' },
  { key: 'story', label: 'ストーリー', category: '作品情報' },
  { key: 'status', label: 'ステータス', category: '管理情報' },
  { key: 'created_at', label: '作成日時', category: '管理情報' },
  { key: 'updated_at', label: '更新日時', category: '管理情報' },
] as const

// エントリーをCSV形式に変換（2行ヘッダー対応）
export function entriesToCSV(entries: EntryWithUser[]): string {
  // 1行目：カテゴリヘッダー
  const categoryHeaders = CSV_HEADERS.map(h => h.category).join(',')
  
  // 2行目：フィールドヘッダー
  const fieldHeaders = CSV_HEADERS.map(h => h.label).join(',')
  
  // データ行を作成
  const rows = entries.map(entry => {
    return CSV_HEADERS.map(header => {
      let value = ''
      
      switch (header.key) {
        case 'user_name':
          value = entry.users?.name || ''
          break
        case 'user_email':
          value = entry.users?.email || ''
          break
        case 'created_at':
        case 'updated_at':
          value = formatDate(entry[header.key as keyof Entry] as string)
          break
        default:
          value = (entry[header.key as keyof Entry] || '') as string
      }
      
      // CSVのエスケープ処理
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`
      }
      
      return value
    }).join(',')
  })
  
  return [categoryHeaders, fieldHeaders, ...rows].join('\n')
}

// CSVをダウンロード
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  
  // 安全にremoveChildを実行
  if (link.parentNode) {
    link.parentNode.removeChild(link)
  }
  
  // URLを解放
  URL.revokeObjectURL(url)
}

// 日付フォーマット
function formatDate(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

// CSVからエントリーデータを解析（インポート用・2行ヘッダー対応）
export function parseCSV(csvContent: string): Partial<Entry>[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length < 3) return [] // カテゴリ行 + フィールド行 + 最低1行のデータ
  
  // 2行目がフィールドヘッダー（1行目はカテゴリヘッダー）
  const headers = lines[1].split(',').map(h => h.trim())
  const entries: Partial<Entry>[] = []
  
  // ヘッダーのマッピングを作成
  const headerMap = new Map<string, string>()
  CSV_HEADERS.forEach(csvHeader => {
    const index = headers.findIndex(h => h === csvHeader.label)
    if (index !== -1) {
      headerMap.set(String(index), csvHeader.key)
    }
  })
  
  // データ行を解析（3行目から開始）
  for (let i = 2; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const entry: Partial<Entry> = {}
    
    values.forEach((value, index) => {
      const key = headerMap.get(String(index))
      if (key && key !== 'user_name' && key !== 'user_email' && key !== 'created_at' && key !== 'updated_at') {
        (entry as Record<string, unknown>)[key] = value
      }
    })
    
    if (Object.keys(entry).length > 0) {
      entries.push(entry)
    }
  }
  
  return entries
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
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}