'use client'

import { FormField, AudioUpload } from '@/components/ui'
import type { SemifinalsInfo } from '@/lib/types'

interface SoundSectionProps {
  semifinalsInfo: Partial<SemifinalsInfo>
  validationErrors: string[]
  onChange: (updates: Partial<SemifinalsInfo>) => void
  onFileUpload: (field: string, file: File) => void
  onFileDelete?: (field: string) => void
  audioFiles?: Record<string, { file_name: string }>
}

export const SoundSection: React.FC<SoundSectionProps> = ({
  semifinalsInfo,
  validationErrors,
  onChange,
  onFileUpload,
  onFileDelete,
  audioFiles
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
        <select
          value={semifinalsInfo.chaser_song_designation || ''}
          onChange={(e) => {
            if (e.target.value === 'included') {
              onChange({ chaser_song_designation: 'included', chaser_song: '' })
            } else if (e.target.value === 'required') {
              onChange({ chaser_song_designation: 'required' })
            } else if (e.target.value === 'not_required') {
              onChange({ chaser_song_designation: 'not_required', chaser_song: '' })
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          <option value="">選択してください</option>
          <option value="included">自作曲に組み込み</option>
          <option value="required">必要</option>
          <option value="not_required">不要（無音）</option>
        </select>
      </div>

      {semifinalsInfo.chaser_song_designation === 'required' && (
        <div>
          <AudioUpload
            label="チェイサー（退場）曲音源"
            value={audioFiles?.chaser_song?.file_name || ''}
            onChange={(file) => {
              console.log('[SOUND SECTION] Uploading chaser_song file:', file.name)
              onFileUpload('chaser_song', file)
            }}
            onDelete={() => {
              console.log('[SOUND SECTION] Deleting chaser_song')
              if (onFileDelete) {
                onFileDelete('chaser_song')
              }
            }}
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