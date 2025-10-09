'use client'

import { FormField } from '@/components/ui'
import type { FinalsInfo } from '@/lib/types'

interface FinalsSoundSectionProps {
  finalsInfo: Partial<FinalsInfo>
  soundChangeOption: 'same' | 'different' | ''
  validationErrors: string[]
  onChange: (updates: Partial<FinalsInfo>) => void
  onSoundChangeOption: (option: 'same' | 'different') => void
  onFileUpload: (field: string, file: File) => void
  onFileDelete?: (field: string) => void
  audioFiles?: Record<string, { file_name: string }>
  isEditable?: boolean
  // プログレスバー用の状態（親フォームから渡される）
  uploading?: boolean
  progress?: number
}

export const FinalsSoundSection: React.FC<FinalsSoundSectionProps> = ({
  finalsInfo,
  soundChangeOption,
  validationErrors,
  onChange,
  onSoundChangeOption,
  isEditable = true,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">音響指示情報</h4>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800 font-medium">以下の項目を入力してください：</p>
          <ul className="list-disc list-inside text-sm text-red-700 mt-2">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          準決勝との音響指示 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center text-gray-900">
            <input
              type="radio"
              name="sound_change_option"
              value="different"
              checked={soundChangeOption === 'different'}
              onChange={() => onSoundChangeOption('different')}
              disabled={!isEditable}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝と異なる音響指示
          </label>
          <label className="flex items-center text-gray-900">
            <input
              type="radio"
              name="sound_change_option"
              value="same"
              checked={soundChangeOption === 'same'}
              onChange={() => onSoundChangeOption('same')}
              disabled={!isEditable}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝と同じ音響指示
          </label>
        </div>
      </div>

      <FormField
        label="音楽スタートのタイミング（きっかけ、ポーズなど） *"
        name="sound_start_timing"
        value={finalsInfo.sound_start_timing || ''}
        onChange={(e) => onChange({ sound_start_timing: e.target.value })}
        disabled={soundChangeOption === 'same' || !isEditable}
        required={soundChangeOption === 'different'}
      />
    </div>
  )
}