'use client'

interface RehearsalSectionProps {
  semifinalsInfo: {
    rehearsal_participation?: string
  }
  onChange: (updates: {
    rehearsal_participation?: string
  }) => void
  isEditable?: boolean
}

export function RehearsalSection({
  semifinalsInfo,
  onChange,
  isEditable = true
}: RehearsalSectionProps) {
  const handleRadioChange = (value: string) => {
    onChange({ rehearsal_participation: value })
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900">リハーサルについて</h3>
        <span className="text-sm text-red-500">* は必須項目です</span>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-gray-700 space-y-1">
          <div>実施時間：11月23日　6:20～10:40（多少の変更あり）</div>
          <div>実施場所：飛天（本会場）</div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">
            <span className="text-red-500">* </span>リハーサルへの参加
          </div>

          <div className="space-y-2 ml-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="rehearsal_participation"
                value="希望する"
                checked={semifinalsInfo.rehearsal_participation === '希望する'}
                onChange={(e) => handleRadioChange(e.target.value)}
                disabled={!isEditable}
                className="mr-3 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">
                希望する（時間指定はできません）
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="rehearsal_participation"
                value="希望しない"
                checked={semifinalsInfo.rehearsal_participation === '希望しない'}
                onChange={(e) => handleRadioChange(e.target.value)}
                disabled={!isEditable}
                className="mr-3 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700">
                希望しない
              </span>
            </label>
          </div>
        </div>

        <div className="text-sm text-gray-600 mt-4">
          ※リハーサルの順番（＝準決勝の出場順）は、後日抽選により決定する予定です。
        </div>
      </div>
    </div>
  )
}