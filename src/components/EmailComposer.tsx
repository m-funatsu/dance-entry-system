'use client'

import { useState, useEffect } from 'react'

interface EmailComposerProps {
  selectedEntriesData: Array<{
    id: string
    users: {
      name: string
      email: string
    }
    participant_names: string
    dance_style: string
  }>
  onClose: () => void
  onSent: () => void
}

interface Template {
  id: string
  name: string
  subject: string
  body: string
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  selectedEntriesData,
  onClose,
  onSent
}) => {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  // デフォルトテンプレート
  const defaultTemplates = [
    {
      id: 'welcome',
      name: '【準決勝進出】おめでとうございます',
      subject: '【バルカーカップ】準決勝進出のご連絡',
      body: `お疲れ様です。バルカーカップ事務局です。

この度は、予選にご参加いただき、誠にありがとうございました。

厳正な審査の結果、準決勝にお進みいただくことが決定いたしましたので、ご連絡申し上げます。

準決勝の詳細につきましては、後日改めてご連絡させていただきます。

引き続きよろしくお願いいたします。

バルカーカップ事務局
entry-vqcup@valqua.com`
    }
  ]

  // データベースからテンプレートを取得
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        console.log('[TEMPLATE LOAD] === テンプレート取得開始 ===')
        const response = await fetch('/api/admin/notification-templates')
        console.log('[TEMPLATE LOAD] レスポンス状態:', response.status, response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[TEMPLATE LOAD] 取得データ:', data)
          console.log('[TEMPLATE LOAD] データ型:', typeof data)
          console.log('[TEMPLATE LOAD] 配列判定:', Array.isArray(data))
          
          // APIが配列を直接返すため、data.templatesではなくdataを使用
          const templatesData = Array.isArray(data) ? data : (data.templates || [])
          console.log('[TEMPLATE LOAD] 最終テンプレートデータ:', templatesData)
          setTemplates(templatesData)
        } else {
          console.error('[TEMPLATE LOAD] API失敗:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('[TEMPLATE LOAD] テンプレート取得エラー:', error)
      } finally {
        setTemplatesLoading(false)
        console.log('[TEMPLATE LOAD] === テンプレート取得完了 ===')
      }
    }
    loadTemplates()
  }, [])

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    
    // データベーステンプレートまたはデフォルトテンプレートから選択
    const allTemplates = [...templates, ...defaultTemplates]
    const template = allTemplates.find(t => t.id === templateId)
    
    if (template) {
      setSubject(template.subject)
      setBody(template.body)
    } else {
      setSubject('')
      setBody('')
    }
  }

  const handleSendEmails = () => {
    const emailAddresses = selectedEntriesData
      .map(entry => entry.users.email)
      .filter(email => email && email.trim() !== '')
      .join(', ')
    
    if (!emailAddresses) {
      alert('有効なメールアドレスが見つかりません')
      return
    }
    
    const toAddress = 'entry-vqcup@valqua.com'
    
    // 文字数制限でmailtoリンクの長さを制御
    const maxSubjectLength = 60   // 安全な件名長さ
    
    const cleanSubject = subject.trim().length > maxSubjectLength 
      ? subject.trim().substring(0, maxSubjectLength) + '...' 
      : subject.trim()
    
    // mailtoリンクを作成（To、BCC、件名のみ、本文なし）
    const mailtoLink = `mailto:${toAddress}?bcc=${encodeURIComponent(emailAddresses)}&subject=${encodeURIComponent(cleanSubject)}`
    
    console.log('mailto link length:', mailtoLink.length)
    
    // メーラーを開く
    window.location.href = mailtoLink
    
    // コンポーザーを閉じる
    onSent()
    onClose()
    
    // メーラー起動後にページをリロード
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              メール送信 ({selectedEntriesData.length}名)
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">閉じる</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* メール作成 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  テンプレート選択
                  {templatesLoading && <span className="text-xs text-gray-500 ml-2">読み込み中...</span>}
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  disabled={templatesLoading}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">テンプレートを選択...</option>
                  {/* データベースからのテンプレート */}
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                  {/* デフォルトテンプレート */}
                  {templates.length > 0 && <option disabled>--- デフォルト ---</option>}
                  {defaultTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  件名
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="メールの件名を入力..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メール本文
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="メール本文を入力..."
                />
              </div>
            </div>

            {/* 送信先一覧 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                送信先一覧 ({selectedEntriesData.length}名)
              </h4>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {selectedEntriesData.map(entry => (
                  <div key={entry.id} className="p-2 border-b border-gray-100 last:border-b-0">
                    <div className="text-sm font-medium">{entry.users.name}</div>
                    <div className="text-xs text-gray-500">{entry.users.email}</div>
                    <div className="text-xs text-gray-400">{entry.participant_names}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => {
                if (body.trim()) {
                  navigator.clipboard.writeText(body).then(() => {
                    alert('本文をクリップボードにコピーしました')
                  }).catch(() => {
                    alert('コピーに失敗しました')
                  })
                } else {
                  alert('コピーする本文がありません')
                }
              }}
              disabled={!body.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              本文をコピー
            </button>
            <button
              onClick={handleSendEmails}
              disabled={!subject.trim() || selectedEntriesData.length === 0}
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              メーラーを開く ({selectedEntriesData.length}名)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}