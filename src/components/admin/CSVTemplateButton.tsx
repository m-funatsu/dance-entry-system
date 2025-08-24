'use client'

interface CSVTemplateButtonProps {
  templateType: 'basic' | 'preliminary' | 'semifinals' | 'finals' | 'program' | 'sns' | 'applications'
  className?: string
}

const templates = {
  basic: {
    filename: 'basic_info_template',
    headers: [
      'ユーザーメール',
      'エントリー名（participant_names）',
      'ダンススタイル',
      'カテゴリー区分',
      '代表者名',
      '代表者フリガナ',
      '代表者メール',
      '代表者生年月日（YYYY-MM-DD）',
      'パートナー名',
      'パートナーフリガナ',
      'パートナー生年月日（YYYY-MM-DD）',
      '電話番号',
      '緊急連絡先1名前',
      '緊急連絡先1電話',
      '緊急連絡先2名前',
      '緊急連絡先2電話',
      '保護者名',
      '保護者電話',
      'パートナー保護者名',
      'パートナー保護者電話'
    ],
    sampleData: [
      'user@example.com',
      'サンプルエントリー',
      'バレエ',
      'ジュニア',
      '山田太郎',
      'ヤマダタロウ',
      'user@example.com',
      '2000-01-01',
      '佐藤花子',
      'サトウハナコ',
      '2000-02-01',
      '090-1234-5678',
      '山田次郎',
      '090-2345-6789',
      '',
      '',
      '山田一郎',
      '090-3456-7890',
      '佐藤二郎',
      '090-4567-8901'
    ]
  },
  preliminary: {
    filename: 'preliminary_info_template',
    headers: [
      'ユーザーメール',
      'エントリー名（participant_names）',
      '作品タイトル',
      '作品タイトルカナ',
      '作品ストーリー',
      '楽曲タイトル',
      'アーティスト',
      'CDタイトル',
      'JASRAC作品コード',
      '著作権許可',
      '作詞者',
      '作曲者',
      '振付師1名前',
      '振付師1フリガナ',
      '振付師1著作権',
      '振付師2名前',
      '振付師2フリガナ',
      '振付師2著作権'
    ],
    sampleData: [
      'user@example.com',
      'サンプルエントリー',
      'サンプル作品',
      'サンプルサクヒン',
      'この作品は愛と希望をテーマにした物語です。',
      'サンプル楽曲',
      'サンプルアーティスト',
      'サンプルCD',
      'J000000001',
      '許可済み',
      '作詞者名',
      '作曲者名',
      '振付師太郎',
      'フリツケシタロウ',
      'オリジナル',
      '',
      '',
      ''
    ]
  }
}

export default function CSVTemplateButton({ templateType, className = '' }: CSVTemplateButtonProps) {
  const handleDownload = () => {
    const template = templates[templateType as keyof typeof templates]
    if (!template) return
    
    const csvContent = [
      template.headers,
      template.sampleData
    ].map(row => row.map((cell: string) => `"${cell}"`).join(',')).join('\r\n')
    
    // UTF-8 BOMを追加
    const utf8Bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const encoder = new TextEncoder()
    const utf8Bytes = encoder.encode(csvContent)
    const csvWithBom = new Uint8Array(utf8Bom.length + utf8Bytes.length)
    csvWithBom.set(utf8Bom, 0)
    csvWithBom.set(utf8Bytes, utf8Bom.length)
    
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${template.filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <button
      onClick={handleDownload}
      className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium ${className}`}
    >
      📋 テンプレートダウンロード
    </button>
  )
}