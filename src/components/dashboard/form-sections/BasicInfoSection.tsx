'use client'

import React from 'react'

interface BasicInfoSectionProps {
  formData: {
    dance_style: string
    representative_name: string
    representative_furigana: string
    partner_name: string
    partner_furigana: string
    phone_number: string
    agreement_checked: boolean
  }
  errors: Record<string, string>
  onChange: (field: string, value: string | boolean) => void
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  errors,
  onChange
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          ダンスジャンル <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.dance_style}
          onChange={(e) => onChange('dance_style', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">選択してください</option>
          <option value="JAZZ">JAZZ</option>
          <option value="HIPHOP">HIPHOP</option>
          <option value="CONTEMPORARY">CONTEMPORARY</option>
          <option value="その他">その他</option>
        </select>
        {errors.dance_style && <p className="mt-1 text-sm text-red-600">{errors.dance_style}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            代表者名
          </label>
          <input
            type="text"
            value={formData.representative_name}
            onChange={(e) => onChange('representative_name', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            代表者フリガナ
          </label>
          <input
            type="text"
            value={formData.representative_furigana}
            onChange={(e) => onChange('representative_furigana', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            パートナー名
          </label>
          <input
            type="text"
            value={formData.partner_name}
            onChange={(e) => onChange('partner_name', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            パートナーフリガナ
          </label>
          <input
            type="text"
            value={formData.partner_furigana}
            onChange={(e) => onChange('partner_furigana', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          電話番号 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={formData.phone_number}
          onChange={(e) => onChange('phone_number', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="例: 090-1234-5678"
        />
        {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>}
      </div>

      <div className="flex items-start">
        <input
          type="checkbox"
          id="agreement"
          checked={formData.agreement_checked}
          onChange={(e) => onChange('agreement_checked', e.target.checked)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="agreement" className="ml-2 block text-sm text-gray-900">
          参加規約に同意します <span className="text-red-500">*</span>
        </label>
      </div>
      {errors.agreement_checked && <p className="mt-1 text-sm text-red-600">{errors.agreement_checked}</p>}
    </div>
  )
}