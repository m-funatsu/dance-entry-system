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
  audioFiles?: Record<string, { file_name: string }>
  isEditable?: boolean
}

export const FinalsSoundSection: React.FC<FinalsSoundSectionProps> = ({
  finalsInfo,
  soundChangeOption,
  validationErrors,
  onChange,
  onSoundChangeOption,
  onFileUpload,
  onFileDelete,
  audioFiles,
  isEditable = true
}) => {
  console.log('[FINALS SOUND SECTION DEBUG] === FinalsSoundSection レンダリング ===')
  console.log('[FINALS SOUND SECTION DEBUG] audioFiles:', audioFiles)
  console.log('[FINALS SOUND SECTION DEBUG] audioFiles?.chaser_song:', audioFiles?.chaser_song)
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
              value="same"
              checked={soundChangeOption === 'same'}
              onChange={() => onSoundChangeOption('same')}
              disabled={!isEditable}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝と同じ音響指示
          </label>
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
        </div>
      </div>

      <FormField
        label="音楽スタートのタイミング（きっかけ、ポーズなど）"
        name="sound_start_timing"
        value={finalsInfo.sound_start_timing || ''}
        onChange={(e) => onChange({ sound_start_timing: e.target.value })}
        disabled={soundChangeOption === 'same' || !isEditable}
        required={soundChangeOption === 'different'}
      />

      <FormField
        label="チェイサー（退場）曲の指定"
        name="chaser_song_designation"
        type="select"
        value={finalsInfo.chaser_song_designation || ''}
        onChange={(e) => {
          const newValue = e.target.value
          onChange({ chaser_song_designation: newValue })
          
          // 「自作曲に組み込み」または「不要（無音）」選択時は音源ファイルを削除
          if ((newValue === '自作曲に組み込み' || newValue === '不要（無音）')) {
            if ((finalsInfo.chaser_song && finalsInfo.chaser_song.trim()) || audioFiles?.chaser_song) {
              console.log('[FINALS CHASER CHANGE] チェイサー曲指定変更 - 音源を削除:', newValue)
              if (onFileDelete) {
                onFileDelete('chaser_song')
              }
            }
          }
        }}
        disabled={soundChangeOption === 'same' || !isEditable}
        required={soundChangeOption === 'different'}
      >
        <option value="">選択してください</option>
        <option value="自作曲に組み込み">自作曲に組み込み</option>
        <option value="必要">必要</option>
        <option value="不要（無音）">不要（無音）</option>
      </FormField>

      {finalsInfo.chaser_song_designation === '必要' && (
        <div>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="text-sm text-yellow-800 space-y-2">
              <p className="font-medium">チェイサー（退場曲）について</p>
              <p>
                作品に一般曲（自作曲ではない楽曲）をご指定の場合、作品と同じ楽曲を使用することは不可とさせていただきます。
              </p>
              <p>
                チェイサー楽曲が必要な場合は、下記サイトより楽曲をお選びいただき、下記に楽曲データをアップロードお願いいたします。
              </p>
              <div className="space-y-1 mt-2">
                <p>
                  <a href="https://dova-s.jp/" target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:text-blue-800 underline">
                    DOVA-SYNDROME
                  </a>
                </p>
                <p>
                  <a href="https://bgmer.net/" target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:text-blue-800 underline">
                    BGMer
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          <AudioUpload
            label="チェイサー（退場）曲 音源"
            value={finalsInfo.chaser_song || ''}
            displayName={audioFiles?.chaser_song?.file_name}
            onChange={(file) => {
              console.log('[FINALS CHASER UPLOAD] === 決勝チェイサー曲ファイル選択 ===')
              console.log('[FINALS CHASER UPLOAD] 選択されたファイル:', file.name)
              onFileUpload('chaser_song', file)
            }}
            onDelete={onFileDelete ? () => {
              console.log('[FINALS CHASER DELETE] === 決勝チェイサー曲削除 ===')
              onFileDelete('chaser_song')
            } : undefined}
            disabled={soundChangeOption === 'same' || !isEditable}
            required={soundChangeOption === 'different' && finalsInfo.chaser_song_designation === '必要'}
            deletable={soundChangeOption === 'different'} // 異なる音響指示時のみ削除可能
            accept=".wav,.mp3,.m4a"
          />
        </div>
      )}

      <FormField
        label="フェードアウト開始時間"
        name="fade_out_start_time"
        value={finalsInfo.fade_out_start_time || ''}
        onChange={(e) => onChange({ fade_out_start_time: e.target.value })}
        placeholder="例：3:45"
        disabled={soundChangeOption === 'same' || !isEditable}
        required={soundChangeOption === 'different'}
      />

      <FormField
        label="フェードアウト完了時間"
        name="fade_out_complete_time"
        value={finalsInfo.fade_out_complete_time || ''}
        onChange={(e) => onChange({ fade_out_complete_time: e.target.value })}
        placeholder="例：4:00"
        disabled={soundChangeOption === 'same' || !isEditable}
        required={soundChangeOption === 'different'}
      />
    </div>
  )
}