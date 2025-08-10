'use client'

import { FormField, AudioUpload } from '@/components/ui'
import type { FinalsInfo } from '@/lib/types'

interface FinalsSoundSectionProps {
  finalsInfo: Partial<FinalsInfo>
  soundChangeOption: 'same' | 'different' | ''
  validationErrors: string[]
  onChange: (updates: Partial<FinalsInfo>) => void
  onSoundChangeOption: (option: 'same' | 'different') => void
  onFileUpload: (field: string, file: File) => void
  onFileDelete?: (field: string) => void
}

export const FinalsSoundSection: React.FC<FinalsSoundSectionProps> = ({
  finalsInfo,
  soundChangeOption,
  validationErrors,
  onChange,
  onSoundChangeOption,
  onFileUpload,
  onFileDelete
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">音響指示情報</h4>
      
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          準決勝との音響指示 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="sound_change_option"
              value="same"
              checked={soundChangeOption === 'same'}
              onChange={() => onSoundChangeOption('same')}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝と同じ音響指示
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="sound_change_option"
              value="different"
              checked={soundChangeOption === 'different'}
              onChange={() => onSoundChangeOption('different')}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝と異なる音響指示
          </label>
        </div>
      </div>

      <FormField
        label="音楽スタートのタイミング（きっかけ、ポーズなど）"
        name="sound_start_timing"
        value={finalsInfo.sound_start_timing || ''}
        onChange={(e) => onChange({ sound_start_timing: e.target.value })}
        disabled={soundChangeOption === 'same'}
        required={soundChangeOption === 'different'}
      />

      <FormField
        label="チェイサー（退場）曲の指定"
        name="chaser_song_designation"
        type="select"
        value={finalsInfo.chaser_song_designation || ''}
        onChange={(e) => onChange({ chaser_song_designation: e.target.value })}
        disabled={soundChangeOption === 'same'}
        required={soundChangeOption === 'different'}
      >
        <option value="">選択してください</option>
        <option value="自作曲に組み込み">自作曲に組み込み</option>
        <option value="必要">必要</option>
        <option value="不要（無音）">不要（無音）</option>
      </FormField>

      {finalsInfo.chaser_song_designation === '必要' && (
        <div>
          <AudioUpload
            label="チェイサー（退場）曲 音源"
            value={finalsInfo.chaser_song}
            onChange={(file) => onFileUpload('chaser_song', file)}
            onDelete={onFileDelete ? () => onFileDelete('chaser_song') : undefined}
            disabled={soundChangeOption === 'same'}
            required={soundChangeOption === 'different' && finalsInfo.chaser_song_designation === '必要'}
          />
        </div>
      )}

      <FormField
        label="フェードアウト開始時間"
        name="fade_out_start_time"
        value={finalsInfo.fade_out_start_time || ''}
        onChange={(e) => onChange({ fade_out_start_time: e.target.value })}
        placeholder="例：3:45"
        disabled={soundChangeOption === 'same'}
        required={soundChangeOption === 'different'}
      />

      <FormField
        label="フェードアウト完了時間"
        name="fade_out_complete_time"
        value={finalsInfo.fade_out_complete_time || ''}
        onChange={(e) => onChange({ fade_out_complete_time: e.target.value })}
        placeholder="例：4:00"
        disabled={soundChangeOption === 'same'}
        required={soundChangeOption === 'different'}
      />
    </div>
  )
}