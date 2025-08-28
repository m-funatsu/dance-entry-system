'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { StartDateNotice } from '@/components/ui/StartDateNotice'
import type { Entry } from '@/lib/types'

interface ConsentFormProps {
  entryId: string | null
  initialData: Entry | null
  isEditable?: boolean
}

export default function ConsentForm({ entryId, initialData, isEditable = true }: ConsentFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  console.log('ConsentForm isEditable:', isEditable)
  
  const [consentChecked, setConsentChecked] = useState(initialData?.consent_form_submitted || false)
  const [saving, setSaving] = useState(false)
  const [isStartDateAvailable, setIsStartDateAvailable] = useState(false)

  const handleAvailabilityChange = useCallback((isAvailable: boolean) => {
    setIsStartDateAvailable(isAvailable)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!consentChecked) {
      showToast('同意事項にチェックを入れてください', 'error')
      return
    }

    if (!entryId) {
      showToast('基本情報を先に保存してください', 'error')
      router.push('/dashboard/basic-info')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('entries')
        .update({
          consent_form_submitted: true,
          consent_form_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)

      if (error) throw error

      showToast('参加同意書を提出しました', 'success')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error submitting consent form:', error)
      showToast('同意書の提出に失敗しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <StartDateNotice 
        section="consent_form"
        onAvailabilityChange={handleAvailabilityChange}
      />
      
      {/* 入力開始日後のみフォーム表示 */}
      {isStartDateAvailable && (
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">参加同意書</h3>
          
          <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            <div className="text-center mb-6">
              <h4 className="font-bold text-lg">2025　バルカーカップジャパンオープンショーダンス選手権　参加同意書</h4>
            </div>
            
            <h4 className="font-bold text-base mb-4">【同意事項】</h4>
            
            <div className="space-y-6">
              <div>
                <h5 className="font-semibold text-base mb-2">①エントリーについて</h5>
                <p>「2025 バルカーカップジャパンオープンショーダンス選手権」（以下、本大会といいます。）期間中に主催者及び大会実施場所における施設管理者が定めたすべての規約、規則、指示に遵守いただける方のみエントリーください。</p>
                <p className="mt-2">なお、かかる規約、規則等を遵守いただけない場合、主催者の判断によりエントリー、出場の取消又は失格とさせていただくこともあることを予めご了承ください。</p>
              </div>
              
              <div>
                <h5 className="font-semibold text-base mb-2">②事故・怪我の対応について</h5>
                <div className="space-y-2">
                  <p>１．出場者は、本大会に出場するにあたり、自身の健康状態に無理がない状態で臨むものとします。</p>
                  <p>２．出場者は、自らのパフォーマンスその他出場者の行為に専ら起因する事故・怪我・発病等が発生した場合、出場者に生じた身体及び精神的な傷害ならびに医療費その他の費用について、主催者及び施設管理者は一切責任を負わないものとします。</p>
                  <p>３．出場者が他人に怪我を負わせた場合又は本大会の備品その他物品を損壊した場合、その責任は出場者自身にあり、主催者及び施設管理者は当該怪我に関する費用や損害賠償等の責任は一切負わないものとします。</p>
                </div>
              </div>
              
              <div>
                <h5 className="font-semibold text-base mb-2">③個人情報保護について</h5>
                <div className="space-y-2">
                  <p>本大会では、個人情報の適正な収集・利用・管理等に取り組んでおります。</p>
                  <p>出場者は、必ず以下の弊社個人情報保護方針をご確認いただき、同意の上でエントリーして下さい。</p>
                  <p>
                    <a href="https://www.valquacup.jp/policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline">
                      プライバシーポリシー | バルカーカップ（Valqua Cup） – ジャパンオープンショーダンス選手権
                    </a>
                  </p>
                </div>
              </div>
              
              <div>
                <h5 className="font-semibold text-base mb-2">④肖像利用について</h5>
                <p>出場者は、本大会期間中および終了後、主催者が主催するダンス大会（本大会を含みますがこれに限りません。）のプロモーションを目的として、テレビ、インターネット、SNS、雑誌、その他の各種メディア、並びに翌年以降に主催者が主催するダンス大会のポスター等において、出場者の氏名および大会中に撮影・録画された写真・映像等を、本大会主催者が自由に利用（加工・編集を含みます。）することに同意するものとします。</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm">
                <strong>注意事項：</strong>本同意書の提出後は、内容の変更ができません。十分にご確認の上、同意してください。
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-md">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              disabled={initialData?.consent_form_submitted || !isEditable}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              私は、①エントリーについて、②事故・怪我の対応について、③個人情報保護について、④肖像利用について、の内容を確認し、同意します。
              {initialData?.consent_form_submitted && (
                <span className="ml-2 text-green-600">（提出済み）</span>
              )}
            </span>
          </label>
          
          <div className="mt-3 space-y-1 text-xs text-gray-600">
            <p>※18歳未満の方の場合、必ず親権者（法定代理人）の方の承認を得たうえで、ご同意ください。</p>
            <p>※18歳未満の方の場合、エントリーいただいた後に親権者（法定代理人）の方の同意書をいただくことになりますのでご了承ください。</p>
          </div>
        </div>

        {initialData?.consent_form_submitted && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  参加同意書は提出済みです。
                  {initialData.consent_form_submitted_at && (
                    <span className="block text-xs mt-1">
                      提出日時: {new Date(initialData.consent_form_submitted_at).toLocaleString('ja-JP')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

          <div className="flex justify-end">
            {!initialData?.consent_form_submitted && (
              <button
                type="submit"
                disabled={saving || !consentChecked || !isEditable}
                className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
                  saving || !consentChecked
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                }`}
              >
                {saving ? '提出中...' : '同意して提出'}
              </button>
            )}
          </div>
        </form>
      )}
    </>
  )
}