'use client'

interface DownloadButtonProps {
  data: string[][]
  headers: string[]
  filename: string
  className?: string
}

export default function DownloadButton({ data, headers, filename, className = '' }: DownloadButtonProps) {
  const handleDownload = () => {
    const csvContent = [
      headers,
      ...data
    ].map(row => row.map((cell: string) => `"${cell}"`).join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
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