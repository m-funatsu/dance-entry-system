'use client'

import React from 'react'

interface AdditionalInfoSectionProps {
  formData: {
    choreographer: string
    choreographer_furigana: string
    story: string
  }
  errors: Record<string, string>
  onChange: (field: string, value: string) => void
}

export const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({
  formData,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">追加情報</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            振付師
          </label>
          <input
            type="text"
            value={formData.choreographer}
            onChange={(e) => onChange('choreographer', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            振付師フリガナ
          </label>
          <input
            type="text"
            value={formData.choreographer_furigana}
            onChange={(e) => onChange('choreographer_furigana', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          ストーリー・作品説明
        </label>
        <textarea
          value={formData.story}
          onChange={(e) => onChange('story', e.target.value)}
          rows={5}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="作品のストーリーや説明を入力してください"
        />
      </div>
    </div>
  )
}