// CSVテンプレートの定義
export const CSV_TEMPLATE_HEADERS = [
  'ダンスジャンル',
  '代表者名',
  '代表者フリガナ',
  'パートナー名',
  'パートナーフリガナ',
  '電話番号',
  '緊急連絡先',
  '振付師名',
  '振付師フリガナ',
  '楽曲タイトル（準決勝）',
  '原曲アーティスト（準決勝）',
  '楽曲タイトル（決勝）',
  '原曲アーティスト（決勝）',
  '作品タイトル／テーマ',
  'ストーリー・コンセプト',
  '協賛企業・協賛品',
  '備考',
  '任意申請'
]

export const CSV_TEMPLATE_SAMPLE_DATA = [
  '社交ダンス',
  'バルカー太郎',
  'バルカー タロウ',
  'バルカー花子',
  'バルカー ハナコ',
  '090-1234-5678',
  '緊急時の連絡先（氏名・電話番号）',
  '山田振付師',
  'ヤマダ フリツケシ',
  '楽曲タイトル1',
  'アーティスト名1',
  '楽曲タイトル2（異なる楽曲を使用する場合のみ）',
  'アーティスト名2（異なる楽曲を使用する場合のみ）',
  '作品のタイトルまたはテーマ',
  'ストーリーやコンセプトの説明',
  '協賛企業名や協賛品（任意）',
  'その他備考（任意）',
  '任意申請内容（任意）'
]

export const CSV_TEMPLATE_INSTRUCTIONS = `# CSVインポート用テンプレート
# 
# 使用方法：
# 1. このファイルをダウンロードして、各行にエントリー情報を入力してください
# 2. 1行目のヘッダー行は変更しないでください
# 3. 2行目はサンプルデータです。実際のデータ入力時は削除してください
# 4. 文字コードはUTF-8（BOM付き）で保存してください
# 5. カンマを含むデータは""で囲んでください
# 
# 注意事項：
# - ダンスジャンルは以下から選択: 社交ダンス, バレエ・コンテンポラリーダンス, ジャズダンス, ストリートダンス全般
# - 決勝用楽曲は準決勝と異なる楽曲を使用する場合のみ入力
# - 任意項目は空欄でも構いません
#`

// CSVテンプレートを生成する関数
export function generateCSVTemplate(): string {
  const headers = CSV_TEMPLATE_HEADERS.join(',')
  const sampleData = CSV_TEMPLATE_SAMPLE_DATA.map(data => {
    // カンマや改行を含む可能性があるデータは引用符で囲む
    if (data.includes(',') || data.includes('\n') || data.includes('"')) {
      return `"${data.replace(/"/g, '""')}"`
    }
    return data
  }).join(',')
  
  return `${headers}\n${sampleData}`
}

// BOM付きUTF-8でエンコードする関数
export function generateCSVWithBOM(content: string): Uint8Array {
  const BOM = '\uFEFF'
  const encoder = new TextEncoder()
  return encoder.encode(BOM + content)
}