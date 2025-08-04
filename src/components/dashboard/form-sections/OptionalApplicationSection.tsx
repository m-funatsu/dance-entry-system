'use client'

import React from 'react'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface OptionalApplicationSectionProps {
  // 今後の拡張用にインターフェースを定義
}

export const OptionalApplicationSection: React.FC<OptionalApplicationSectionProps> = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">任意申請</h3>
      <p className="text-sm text-gray-600">
        今後、任意の申請事項がある場合はこちらに表示されます。
      </p>
    </div>
  )
}