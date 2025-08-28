'use client'

interface CSVTemplateButtonProps {
  templateType: 'basic'
  className?: string
}

const templates = {
  basic: {
    filename: 'basic_info_template',
    headers: [
      'ダンスジャンル',
      '代表者名',
      '代表者フリガナ',
      '代表者メール',
      '電話番号',
      'パートナー名',
      'パートナーフリガナ'
    ],
    sampleData: [
      'バレエ',
      '山田太郎',
      'ヤマダタロウ',
      'yamada@example.com',
      '090-1234-5678',
      '佐藤花子',
      'サトウハナコ'
    ]
  },
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
      className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${className}`}
    >
      📋 テンプレートダウンロード
    </button>
  )
}