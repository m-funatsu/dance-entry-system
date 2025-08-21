'use client'

interface EditButtonProps {
  href: string
  children: React.ReactNode
  className?: string
}

export default function EditButton({ href, children, className = "font-medium text-indigo-600 hover:text-indigo-500" }: EditButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('[EDIT BUTTON] Navigating to:', href)
    window.location.href = href
  }

  return (
    <button 
      onClick={handleClick}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </button>
  )
}