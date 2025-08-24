'use client'

interface DownloadButtonProps {
  data: string[][]
  headers: string[]
  filename: string
  className?: string
}

export default function DownloadButton({ data, headers, filename, className = '' }: DownloadButtonProps) {
  const handleDownload = async () => {
    const csvContent = [
      headers,
      ...data
    ].map(row => row.map((cell: string) => `"${cell}"`).join(',')).join('\r\n')
    
    try {
      // TextEncoderでUTF-16LEエンコーディング（ExcelでSJISとして認識される）
      const encoder = new TextEncoder()
      const utf8Bytes = encoder.encode(csvContent)
      
      // UTF-8のBOMを追加
      const utf8Bom = new Uint8Array([0xEF, 0xBB, 0xBF])
      const csvWithBom = new Uint8Array(utf8Bom.length + utf8Bytes.length)
      csvWithBom.set(utf8Bom, 0)
      csvWithBom.set(utf8Bytes, utf8Bom.length)
      
      const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (error) {
      console.error('CSV download error:', error)
      // フォールバック: 元の方法
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    }
  }

  return (
    <button
      onClick={handleDownload}
      className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium ${className}`}
    >
      📥 CSV ダウンロード
    </button>
  )
}