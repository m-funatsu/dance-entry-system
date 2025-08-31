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
  onFileDelete?: (field: string) => Promise<void>
  isEditable?: boolean
}

export const FinalsChoreographerSection: React.FC<FinalsChoreographerSectionProps> = ({
  finalsInfo,
  choreographerChangeOption,
  validationErrors,
  onChange,
  onChoreographerChangeOption,
  onFileUpload,
  onFileDelete,
  isEditable = true
}) => {
  return (
    <div className="space-y-6">
      <h4 className="font-medium text-gray-900">振付師情報</h4>
      
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
      
      {/* 振付師の変更選択を最上部に配置 */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          振付師の変更 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center text-gray-900">
            <input
              type="radio"
              name="choreographer_change_option"
              value="different"
              checked={choreographerChangeOption === 'different'}
              onChange={() => onChoreographerChangeOption('different')}
              disabled={!isEditable}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝とは異なる振付師
          </label>
          <label className="flex items-center text-gray-900">
            <input
              type="radio"
              name="choreographer_change_option"
              value="same"
              checked={choreographerChangeOption === 'same'}
              onChange={() => onChoreographerChangeOption('same')}
              disabled={!isEditable}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            準決勝と同じ振付師
          </label>
        </div>
      </div>

      {/* 振付師情報セクション */}
      <div className="border-t pt-6">
        <h4 className="font-medium mb-4 text-gray-900">振付師詳細情報</h4>
        
        <FormField
          label="振付師 氏名① *"
          name="choreographer_name"
          value={finalsInfo.choreographer_name || ''}
          onChange={(e) => onChange({ choreographer_name: e.target.value })}
          disabled={choreographerChangeOption === 'same'}
          required={choreographerChangeOption === 'different'}
        />

        <FormField
          label="振付師 氏名フリガナ① *"
          name="choreographer_furigana"
          value={finalsInfo.choreographer_furigana || ''}
          onChange={(e) => onChange({ choreographer_furigana: e.target.value })}
          disabled={choreographerChangeOption === 'same'}
          required={choreographerChangeOption === 'different'}
          placeholder="ひらがなで入力"
        />

        <FormField
          label="振付師 氏名②"
          name="choreographer2_name"
          value={finalsInfo.choreographer2_name || ''}
          onChange={(e) => onChange({ choreographer2_name: e.target.value })}
          disabled={choreographerChangeOption === 'same'}
        />

        <FormField
          label="振付師 氏名フリガナ②"
          name="choreographer2_furigana"
          value={finalsInfo.choreographer2_furigana || ''}
          onChange={(e) => onChange({ choreographer2_furigana: e.target.value })}
          disabled={choreographerChangeOption === 'same'}
          placeholder="ひらがなで入力"
        />
      </div>

      {/* 振付変更（常に表示） */}
      <div className="border-t pt-6">
        <h4 className="font-medium mb-4 text-gray-900">振付変更</h4>
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <FormField
            label="振付変更部分（曲が始まってから何分何秒の部分か） *"
            name="choreography_change_timing"
            value={finalsInfo.choreography_change_timing || ''}
            onChange={(e) => onChange({ choreography_change_timing: e.target.value })}
            required={choreographerChangeOption === 'different'}
            placeholder="例：1分30秒〜2分15秒"
          />

          <FormField
            label="変更前（準決勝振付） *"
            name="choreography_before_change"
            type="textarea"
            value={finalsInfo.choreography_before_change || ''}
            onChange={(e) => onChange({ choreography_before_change: e.target.value })}
            required={choreographerChangeOption === 'different'}
            rows={3}
            placeholder="準決勝での振付内容を記載"
          />

          <FormField
            label="変更後（決勝振付） *"
            name="choreography_after_change"
            type="textarea"
            value={finalsInfo.choreography_after_change || ''}
            onChange={(e) => onChange({ choreography_after_change: e.target.value })}
            required={choreographerChangeOption === 'different'}
            rows={3}
            placeholder="決勝での振付内容を記載"
          />
        </div>
      </div>

      {/* 小道具セクション */}
      <div className="border-t pt-6">
        <h4 className="font-medium mb-4 text-gray-900">小道具</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            小道具の有無 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center text-gray-900">
              <input
                type="radio"
                name="props_usage"
                value="あり"
                checked={finalsInfo.props_usage === 'あり'}
                onChange={() => onChange({ props_usage: 'あり' })}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              あり
            </label>
            <label className="flex items-center text-gray-900">
              <input
                type="radio"
                name="props_usage"
                value="なし"
                checked={finalsInfo.props_usage === 'なし'}
                onChange={() => onChange({ props_usage: 'なし', props_details: '' })}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              なし
            </label>
          </div>
        </div>

        {finalsInfo.props_usage === 'あり' && (
          <FormField
            label="利用する小道具"
            name="props_details"
            value={finalsInfo.props_details || ''}
            onChange={(e) => onChange({ props_details: e.target.value })}
            required
            placeholder="例：扇子、スカーフ、傘など"
          />
        )}
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3 text-gray-900">作品振付師出席情報</h4>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-800">
            当日、決勝入賞したペアの振付師を表彰する際、振付師の方にご登壇いただきます。その際、ご希望であれば、振付師の代理人の方でも、ご登壇いただくことが可能です。<br />
            その際、会場モニターへお写真を追加いたしますので、振付師の方のお写真を登録ください。<br />
            また、振付師の方の出席状況についてもあわせてご回答お願いいたします。
          </p>
        </div>
        
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
            <label className="block text-sm font-medium text-gray-900 mb-2">
              作品振付師写真掲載 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center text-gray-900">
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
              <label className="flex items-center text-gray-900">
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
            作品振付師写真 <span className="text-red-500">*</span>
          </label>
          <ImageUpload
            value={finalsInfo.choreographer_photo_path}
            onChange={(file) => onFileUpload('choreographer_photo_path', file)}
            onDelete={onFileDelete ? () => onFileDelete('choreographer_photo_path') : undefined}
            disabled={!isEditable}
            isEditable={isEditable}
            required
            maxSizeMB={20}
            showStatusBar={true}
            hidePreviewUntilComplete={true}
          />
          <p className="text-xs text-gray-600 mt-2">
            作品振付師写真の追加/削除を行った場合は必ず画面下部の<span className="text-red-600">保存ボタンをクリック</span>してください。
          </p>
        </div>
      </div>
    </div>
  )
}