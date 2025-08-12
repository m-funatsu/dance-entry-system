'use client'

import { FormField, AudioUpload } from '@/components/ui'
import type { SemifinalsInfo } from '@/lib/types'

interface SoundSectionProps {
  semifinalsInfo: Partial<SemifinalsInfo>
  validationErrors: string[]
  onChange: (updates: Partial<SemifinalsInfo>) => void
  onFileUpload: (field: string, file: File) => void
  onFileDelete?: (field: string) => void
}

export const SoundSection: React.FC<SoundSectionProps> = ({
  semifinalsInfo,
  validationErrors,
  onChange,
  onFileUpload,
  onFileDelete
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">音響指示情報</h4>
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
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          チェイサー（退場）曲の指定 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="chaser_designation"
              value="included"
              checked={semifinalsInfo.chaser_song_designation === 'included'}
              onChange={() => onChange({ chaser_song_designation: 'included', chaser_song: '' })}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            自作曲に組み込み
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="chaser_designation"
              value="required"
              checked={semifinalsInfo.chaser_song_designation === 'required'}
              onChange={() => onChange({ chaser_song_designation: 'required' })}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            必要
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="chaser_designation"
              value="not_required"
              checked={semifinalsInfo.chaser_song_designation === 'not_required'}
              onChange={() => onChange({ chaser_song_designation: 'not_required', chaser_song: '' })}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            不要（無音）
          </label>
        </div>
      </div>

      {semifinalsInfo.chaser_song_designation === 'required' && (
        <div>
          <AudioUpload
            label="チェイサー（退場）曲音源"
            value={semifinalsInfo.chaser_song}
            onChange={(file) => {
              console.log('[SOUND SECTION] Uploading chaser_song file:', file.name)
              onFileUpload('chaser_song', file)
            }}
            onDelete={onFileDelete ? () => {
              console.log('[SOUND SECTION] Deleting chaser_song')
              onFileDelete('chaser_song')
            } : undefined}
            required
            accept=".wav,.mp3,.m4a"
          />
        </div>
      )}

      <FormField
        label="フェードアウト開始時間"
        name="fade_out_start_time"
        value={semifinalsInfo.fade_out_start_time || ''}
        onChange={(e) => onChange({ fade_out_start_time: e.target.value })}
        placeholder="例：3:45"
        required
      />

      <FormField
        label="フェードアウト完了時間"
        name="fade_out_complete_time"
        value={semifinalsInfo.fade_out_complete_time || ''}
        onChange={(e) => onChange({ fade_out_complete_time: e.target.value })}
        placeholder="例：4:00"
        required
      />
    </div>
  )
}