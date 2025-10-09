'use client'

interface RegulationSectionProps {
  semifinalsInfo: {
    lift_regulation?: boolean
    no_props?: boolean
    performance_time?: boolean
    no_antisocial?: boolean
  }
  onChange: (updates: {
    lift_regulation?: boolean
    no_props?: boolean
    performance_time?: boolean
    no_antisocial?: boolean
  }) => void
  isEditable?: boolean
}

export function RegulationSection({
  semifinalsInfo,
  onChange,
  isEditable = true
}: RegulationSectionProps) {
  const handleCheckboxChange = (field: string, checked: boolean) => {
    onChange({ [field]: checked })
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">レギュレーション確認</h3>
      <p className="text-sm text-gray-600 mb-4">
        準決勝作品が、以下のレギュレーションを満たしていることを確認し、チェックボックスにチェックください。
      </p>
      <div className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          ※詳細は「バルカーカップ2025競技規程」を参照のこと
        </div>

        <div className="space-y-3">
          <label className="flex items-start">
            <input
              type="checkbox"
              className="mt-1 mr-3 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
              checked={semifinalsInfo.lift_regulation || false}
              onChange={(e) => handleCheckboxChange('lift_regulation', e.target.checked)}
              disabled={!isEditable}
            />
            <span className="text-sm text-gray-700">
              リフトは規定内であること（1回のリフトは15秒以下かつ３回以下）
            </span>
          </label>

          <label className="flex items-start">
            <input
              type="checkbox"
              className="mt-1 mr-3 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
              checked={semifinalsInfo.no_props || false}
              onChange={(e) => handleCheckboxChange('no_props', e.target.checked)}
              disabled={!isEditable}
            />
            <span className="text-sm text-gray-700">
              小道具を使わないこと（選手の衣装の一部ではないアイテム、衣装と切り離すことができるアイテムは小道具とみなされる）
            </span>
          </label>

          <label className="flex items-start">
            <input
              type="checkbox"
              className="mt-1 mr-3 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
              checked={semifinalsInfo.performance_time || false}
              onChange={(e) => handleCheckboxChange('performance_time', e.target.checked)}
              disabled={!isEditable}
            />
            <span className="text-sm text-gray-700">
              演技は時間内であること（フロアーに入場又は曲のスタートのいずれか早い方から退場までが４分以内）
            </span>
          </label>

          <label className="flex items-start">
            <input
              type="checkbox"
              className="mt-1 mr-3 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
              checked={semifinalsInfo.no_antisocial || false}
              onChange={(e) => handleCheckboxChange('no_antisocial', e.target.checked)}
              disabled={!isEditable}
            />
            <div className="text-sm text-gray-700">
              <div>反社会的な印象を受ける作品、衣装等ではないこと</div>
              <ul className="mt-1 ml-4 text-xs text-gray-600 list-disc space-y-1">
                <li>反社会的な印象を与えるもの、まを想起・肯定・助長するもの</li>
                <li>人種・民族・国籍・宗教・性別・性的指向・障がい等に対する差別やヘイト表現、宗教的または政治的な主張を目的とするもの（教義や信条の賛否を訴える表現、布教・批判を含む）</li>
                <li>戦争・紛争・国家間の対立に関する賛否や主張を前面に出すもの、またはそれらを想起させ、対立を煽る表現</li>
                <li>特定の国家・民族・宗教・団体等の旗章やスローガン等を用いた挑発的な表現</li>
                <li>その他、運営が不適切と判断したもの</li>
              </ul>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}