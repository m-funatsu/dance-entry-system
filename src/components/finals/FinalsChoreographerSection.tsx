'use client'

import { FormField, ImageUpload } from '@/components/ui'
import type { FinalsInfo } from '@/lib/types'

interface FinalsChoreographerSectionProps {
  finalsInfo: Partial<FinalsInfo>
  choreographerChangeOption: 'same' | 'different' | ''
  validationErrors: string[]
  onChange: (updates: Partial<FinalsInfo>) => void
  onChoreographerChangeOption: (option: 'same' | 'different') => void
  onFileUpload: (field: string, file: File) => void
}

export const FinalsChoreographerSection: React.FC<FinalsChoreographerSectionProps> = ({
  finalsInfo,
  choreographerChangeOption,
  validationErrors,
  onChange,
  onChoreographerChangeOption,
  onFileUpload
}) => {
  return (
    <div className="space-y-6">
      <h4 className="font-medium">振付変更情報</h4>
      
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
          振付師の変更 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="choreographer_change_option"
              value="same"
              checked={choreographerChangeOption === 'same'}
              onChange={() => onChoreographerChangeOption('same')}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝と同じ振付師
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="choreographer_change_option"
              value="different"
              checked={choreographerChangeOption === 'different'}
              onChange={() => onChoreographerChangeOption('different')}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝とは異なる振付師
          </label>
        </div>
      </div>

      <FormField
        label="決勝 - 振付師"
        name="choreographer_name"
        value={finalsInfo.choreographer_name || ''}
        onChange={(e) => onChange({ choreographer_name: e.target.value })}
        disabled={choreographerChangeOption === 'same'}
      />

      <FormField
        label="決勝 - 振付師（かな）"
        name="choreographer_name_kana"
        value={finalsInfo.choreographer_name_kana || ''}
        onChange={(e) => onChange({ choreographer_name_kana: e.target.value })}
        disabled={choreographerChangeOption === 'same'}
      />

      <FormField
        label="決勝 - 振付師2（決勝でダンサーが振付変更した場合）"
        name="choreographer2_name"
        value={finalsInfo.choreographer2_name || ''}
        onChange={(e) => onChange({ choreographer2_name: e.target.value })}
        disabled={choreographerChangeOption === 'same'}
      />

      <FormField
        label="決勝 - 振付師2（かな）"
        name="choreographer2_name_kana"
        value={finalsInfo.choreographer2_name_kana || ''}
        onChange={(e) => onChange({ choreographer2_name_kana: e.target.value })}
        disabled={choreographerChangeOption === 'same'}
      />

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">作品振付師出席情報</h4>
        
        <div className="space-y-4">
          <FormField
            label="作品振付師出席予定"
            name="choreographer_attendance"
            type="select"
            value={finalsInfo.choreographer_attendance || ''}
            onChange={(e) => onChange({ choreographer_attendance: e.target.value })}
            required
          >
            <option value="">選択してください</option>
            <option value="振付師本人が当日会場で席について観戦する">振付師本人が当日会場で席について観戦する</option>
            <option value="振付師本人が当日会場にいる（役員・選手等）">振付師本人が当日会場にいる（役員・選手等）</option>
            <option value="振付師の代理人が当日会場で席について観戦する">振付師の代理人が当日会場で席について観戦する</option>
            <option value="振付師の代理人が当日会場にいる（役員等）">振付師の代理人が当日会場にいる（役員等）</option>
            <option value="欠席する">欠席する</option>
          </FormField>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作品振付師写真掲載 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="choreographer_photo_permission"
                  value="希望する"
                  checked={finalsInfo.choreographer_photo_permission === '希望する'}
                  onChange={() => onChange({ choreographer_photo_permission: '希望する' })}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                希望する
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="choreographer_photo_permission"
                  value="希望しない"
                  checked={finalsInfo.choreographer_photo_permission === '希望しない'}
                  onChange={() => onChange({ choreographer_photo_permission: '希望しない' })}
                  className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                希望しない
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            作品振付師写真
          </label>
          <ImageUpload
            value={finalsInfo.choreographer_photo_path}
            onChange={(file) => onFileUpload('choreographer_photo_path', file)}
          />
        </div>
      </div>
    </div>
  )
}