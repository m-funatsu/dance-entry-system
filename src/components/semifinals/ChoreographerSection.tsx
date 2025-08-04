'use client'

import { FormField } from '@/components/ui'
import type { SemifinalsInfo, BasicInfo } from '@/lib/types'

interface ChoreographerSectionProps {
  semifinalsInfo: Partial<SemifinalsInfo>
  basicInfo: BasicInfo | null
  onChange: (updates: Partial<SemifinalsInfo>) => void
}

export const ChoreographerSection: React.FC<ChoreographerSectionProps> = ({
  semifinalsInfo,
  basicInfo,
  onChange
}) => {
  const handleChoreographerChange = (checked: boolean) => {
    if (checked) {
      // チェックが入った場合：クリア
      onChange({
        choreographer_change_from_preliminary: true,
        choreographer_name: '',
        choreographer_name_kana: ''
      })
    } else {
      // チェックが外れた場合：基本情報から復元
      onChange({
        choreographer_change_from_preliminary: false,
        choreographer_name: basicInfo?.choreographer || '',
        choreographer_name_kana: basicInfo?.choreographer_furigana || ''
      })
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium">振付情報</h4>
      
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={semifinalsInfo.choreographer_change_from_preliminary || false}
            onChange={(e) => handleChoreographerChange(e.target.checked)}
            className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          予選との振付師の変更
        </label>
      </div>

      <FormField
        label="準決勝 - 振付師"
        name="choreographer_name"
        value={semifinalsInfo.choreographer_name || ''}
        onChange={(e) => onChange({ choreographer_name: e.target.value })}
        disabled={!semifinalsInfo.choreographer_change_from_preliminary}
      />

      <FormField
        label="準決勝 - 振付師（かな）"
        name="choreographer_name_kana"
        value={semifinalsInfo.choreographer_name_kana || ''}
        onChange={(e) => onChange({ choreographer_name_kana: e.target.value })}
        disabled={!semifinalsInfo.choreographer_change_from_preliminary}
      />
      
      {!semifinalsInfo.choreographer_change_from_preliminary && (
        <p className="text-xs text-gray-500">
          基本情報で登録された振付師情報が使用されます。
        </p>
      )}
    </div>
  )
}