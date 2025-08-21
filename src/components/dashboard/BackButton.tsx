'use client'

interface BackButtonProps {
  href?: string
  className?: string
  children?: React.ReactNode
}

export function BackButton({ 
  href = '/dashboard', 
  className = "text-indigo-600 hover:text-indigo-800 mr-4",
  children 
}: BackButtonProps) {
  const handleClick = () => {
    // 強制リロードでダッシュボードに遷移
    window.location.href = href
  }

  return (
    <button
      onClick={handleClick}
      className={`cursor-pointer ${className}`}
      type="button"
    >
      {children || (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      )}
    </button>
  )
}