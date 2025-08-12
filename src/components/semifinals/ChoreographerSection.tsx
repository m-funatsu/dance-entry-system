'use client'

import { FormField } from '@/components/ui'
import type { SemifinalsInfo } from '@/lib/types'

interface ChoreographerSectionProps {
  semifinalsInfo: Partial<SemifinalsInfo>
  onChange: (updates: Partial<SemifinalsInfo>) => void
}

export const ChoreographerSection: React.FC<ChoreographerSectionProps> = ({
  semifinalsInfo,
  onChange
}) => {
  const handleChoreographerChange = (checked: boolean) => {
    onChange({
      choreographer_change_from_preliminary: checked
    })
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
        label="準決勝 - 振付師1"
        name="choreographer_name"
        value={semifinalsInfo.choreographer_name || ''}
        onChange={(e) => onChange({ choreographer_name: e.target.value })}
        required
      />

      <FormField
        label="準決勝 - 振付師2"
        name="choreographer_name_kana"
        value={semifinalsInfo.choreographer_name_kana || ''}
        onChange={(e) => onChange({ choreographer_name_kana: e.target.value })}
      />
      
    </div>
  )
}