'use client'

import { FormField } from '@/components/ui'
import type { SemifinalsInfo, PreliminaryInfo } from '@/lib/types'

interface ChoreographerSectionProps {
  semifinalsInfo: Partial<SemifinalsInfo>
  preliminaryInfo: PreliminaryInfo | null
  onChange: (updates: Partial<SemifinalsInfo>) => void
}

export const ChoreographerSection: React.FC<ChoreographerSectionProps> = ({
  semifinalsInfo,
  preliminaryInfo,
  onChange
}) => {
  const handleChoreographerChange = (checked: boolean) => {
    if (checked) {
      // 変更する場合：フィールドをクリア
      onChange({
        choreographer_change_from_preliminary: true,
        choreographer_name: '',
        choreographer_furigana: '',
        choreographer2_name: '',
        choreographer2_furigana: ''
      })
    } else {
      // 変更しない場合：予選情報からコピー
      onChange({
        choreographer_change_from_preliminary: false,
        choreographer_name: preliminaryInfo?.choreographer1_name || '',
        choreographer_furigana: preliminaryInfo?.choreographer1_furigana || '',
        choreographer2_name: preliminaryInfo?.choreographer2_name || '',
        choreographer2_furigana: preliminaryInfo?.choreographer2_furigana || ''
      })
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900">振付情報</h4>
      
      <div>
        <label className="flex items-center text-gray-900">
          <input
            type="checkbox"
            checked={semifinalsInfo.choreographer_change_from_preliminary || false}
            onChange={(e) => handleChoreographerChange(e.target.checked)}
            className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          予選との振付師の変更
        </label>
        
        {!semifinalsInfo.choreographer_change_from_preliminary && (
          <p className="text-xs text-gray-500 mt-2">
            予選で登録された振付師情報が使用されます。
          </p>
        )}
      </div>

      <FormField
        label="振付師 氏名①"
        name="choreographer_name"
        value={semifinalsInfo.choreographer_name || ''}
        onChange={(e) => onChange({ choreographer_name: e.target.value })}
        disabled={!semifinalsInfo.choreographer_change_from_preliminary}
        required
      />

      <FormField
        label="振付師 氏名フリガナ①"
        name="choreographer_furigana"
        value={semifinalsInfo.choreographer_furigana || ''}
        onChange={(e) => onChange({ choreographer_furigana: e.target.value })}
        disabled={!semifinalsInfo.choreographer_change_from_preliminary}
        required
        placeholder="ひらがなで入力"
      />

      <div className="mt-4">
        <p className="text-sm text-gray-600 mb-2">
          ※振付師が2名いる場合のみ記入してください。
        </p>
        
        <FormField
          label="振付師 氏名②"
          name="choreographer2_name"
          value={semifinalsInfo.choreographer2_name || ''}
          onChange={(e) => onChange({ choreographer2_name: e.target.value })}
          disabled={!semifinalsInfo.choreographer_change_from_preliminary}
        />

        <FormField
          label="振付師 氏名フリガナ②"
          name="choreographer2_furigana"
          value={semifinalsInfo.choreographer2_furigana || ''}
          onChange={(e) => onChange({ choreographer2_furigana: e.target.value })}
          disabled={!semifinalsInfo.choreographer_change_from_preliminary}
          placeholder="ひらがなで入力"
        />
      </div>
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          小道具の有無 <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center text-gray-900">
            <input
              type="radio"
              name="props_usage"
              value="あり"
              checked={semifinalsInfo.props_usage === 'あり'}
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
              checked={semifinalsInfo.props_usage === 'なし'}
              onChange={() => onChange({ props_usage: 'なし', props_details: '' })}
              className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            なし
          </label>
        </div>
      </div>

      {semifinalsInfo.props_usage === 'あり' && (
        <FormField
          label="利用する小道具"
          name="props_details"
          value={semifinalsInfo.props_details || ''}
          onChange={(e) => onChange({ props_details: e.target.value })}
          required
          placeholder="例：扇子、スカーフ、傘など"
        />
      )}
      
    </div>
  )
}