'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import type { Entry } from '@/lib/types'

interface ConsentFormProps {
  entryId: string | null
  initialData: Entry | null
}

export default function ConsentForm({ entryId, initialData }: ConsentFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [consentChecked, setConsentChecked] = useState(initialData?.consent_form_submitted || false)
  const [saving, setSaving] = useState(false)

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">参加同意書</h3>
          
          <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
            <p className="font-medium">主催者への同意事項</p>
            
            <ol className="space-y-3 ml-6 list-decimal">
              <li>
                <strong>参加資格の確認</strong>
                <p className="mt-1">私は、本大会の参加資格を満たしていることを確認し、虚偽の申告がないことを誓約します。</p>
              </li>
              
              <li>
                <strong>撮影・配信への同意</strong>
                <p className="mt-1">大会中の演技の撮影、録画、配信、および主催者による広報活動での使用について同意します。</p>
              </li>
              
              <li>
                <strong>著作権・肖像権</strong>
                <p className="mt-1">大会での演技に関する著作権および肖像権の一部を主催者に委譲することに同意します。</p>
              </li>
              
              <li>
                <strong>安全管理</strong>
                <p className="mt-1">大会参加中の事故や怪我について、主催者の故意または重大な過失による場合を除き、主催者は責任を負わないことを了承します。</p>
              </li>
              
              <li>
                <strong>規約の遵守</strong>
                <p className="mt-1">大会規約および主催者の指示に従うことを誓約します。違反した場合、失格となる可能性があることを了承します。</p>
              </li>
              
              <li>
                <strong>個人情報の取り扱い</strong>
                <p className="mt-1">提供した個人情報が、大会運営および主催者の定めるプライバシーポリシーに基づいて適切に管理されることを了承します。</p>
              </li>
              
              <li>
                <strong>音楽使用許諾</strong>
                <p className="mt-1">使用する楽曲について、必要な権利処理が完了していることを確認し、著作権侵害等の問題が発生した場合は自己責任で対処することを誓約します。</p>
              </li>
              
              <li>
                <strong>大会の変更・中止</strong>
                <p className="mt-1">天災、感染症の流行、その他やむを得ない事情により、大会の内容変更または中止となる可能性があることを了承します。</p>
              </li>
            </ol>

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
              disabled={initialData?.consent_form_submitted}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              上記の同意事項をすべて確認し、内容に同意します。
              {initialData?.consent_form_submitted && (
                <span className="ml-2 text-green-600">（提出済み）</span>
              )}
            </span>
          </label>
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
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          戻る
        </button>
        {!initialData?.consent_form_submitted && (
          <button
            type="submit"
            disabled={saving || !consentChecked}
            className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
              saving || !consentChecked
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {saving ? '提出中...' : '同意して提出'}
          </button>
        )}
      </div>
    </form>
  )
}