import { memo } from 'react'

interface DeadlineNoticeProps {
  deadline: string
  className?: string
}

export const DeadlineNotice = memo<DeadlineNoticeProps>(({ deadline, className = '' }) => {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            入力期限: {deadline}
          </h3>
          <p className="mt-1 text-sm text-blue-700">
            締切期限まではご自由に情報の変更を行えます。
          </p>
        </div>
      </div>
    </div>
  )
})

DeadlineNotice.displayName = 'DeadlineNotice'