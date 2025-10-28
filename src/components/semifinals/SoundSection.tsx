'use client'

import { FormField } from '@/components/ui'
import type { SemifinalsInfo } from '@/lib/types'

interface SoundSectionProps {
  semifinalsInfo: Partial<SemifinalsInfo>
  validationErrors: string[]
  onChange: (updates: Partial<SemifinalsInfo>) => void
  onFileUpload: (field: string, file: File) => void
  onFileDelete?: (field: string) => void
  onSave?: (isTemporary?: boolean, customData?: Partial<SemifinalsInfo>) => Promise<void>
  audioFiles?: Record<string, { file_name: string }>
  isEditable?: boolean
  uploading?: boolean
  progress?: number
}

export const SoundSection: React.FC<SoundSectionProps> = ({
  semifinalsInfo,
  validationErrors,
  onChange,
  isEditable = true,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">音響指示情報</h4>
        <p className="text-sm text-gray-500">
          <span className="text-red-500">*</span> は必須項目です
        </p>
      </div>

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

      <FormField
        label="音楽スタートのタイミング（きっかけ、ポーズなど）"
        name="sound_start_timing"
        value={semifinalsInfo.sound_start_timing || ''}
        onChange={(e) => onChange({ sound_start_timing: e.target.value })}
        disabled={!isEditable}
        required
      />

      <FormField
        label="フェードアウト開始時間"
        name="fade_out_start_time"
        value={semifinalsInfo.fade_out_start_time || ''}
        onChange={(e) => onChange({ fade_out_start_time: e.target.value })}
        disabled={!isEditable}
        placeholder="例: 2:45"
      />

      <FormField
        label="フェードアウト完了時間"
        name="fade_out_complete_time"
        value={semifinalsInfo.fade_out_complete_time || ''}
        onChange={(e) => onChange({ fade_out_complete_time: e.target.value })}
        disabled={!isEditable}
        placeholder="例: 2:55"
      />
    </div>
  )
}