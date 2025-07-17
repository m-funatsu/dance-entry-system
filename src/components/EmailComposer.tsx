'use client'

import { useState, useEffect } from 'react'
import type { NotificationTemplate } from '@/lib/types'

interface EmailComposerProps {
  selectedEntries: string[]
  entries: {
    id: string
    users: {
      name: string
      email: string
    }
    dance_style: string
    team_name?: string
    participant_names: string
    representative_name?: string
    partner_name?: string
    status: string
  }[]
  onClose: () => void
  onSent: () => void
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'selection_pass',
    name: '選考通過通知',
    subject: '【ダンスコンテスト】選考結果のお知らせ - {{name}}様',
    body: `{{name}}様

お疲れ様です。
ダンスコンテスト運営事務局です。

この度は、ダンスコンテストにご応募いただき、誠にありがとうございました。
厳正なる審査の結果、{{name}}様のエントリー「{{dance_style}}」につきまして、見事選考を通過されましたことをお知らせいたします。

■ エントリー情報
・ダンススタイル: {{dance_style}}
・チーム名: {{team_name}}
・参加者名: {{participant_names}}

今後の詳細なスケジュールにつきましては、別途ご連絡させていただきます。

引き続きよろしくお願いいたします。

ダンスコンテスト運営事務局`
  },
  {
    id: 'selection_fail',
    name: '選考結果通知（不選考）',
    subject: '【ダンスコンテスト】選考結果のお知らせ - {{name}}様',
    body: `{{name}}様

お疲れ様です。
ダンスコンテスト運営事務局です。

この度は、ダンスコンテストにご応募いただき、誠にありがとうございました。

厳正なる審査の結果、今回は残念ながら選考を通過することができませんでした。
多数のご応募をいただく中での判断となり、大変心苦しくお伝えすることとなります。

■ エントリー情報
・ダンススタイル: {{dance_style}}
・チーム名: {{team_name}}
・参加者名: {{participant_names}}

今回は惜しくも選考を通過できませんでしたが、{{name}}様の情熱と努力は素晴らしいものでした。
今後も様々な機会がございますので、ぜひチャレンジしていただければと思います。

この度は貴重なお時間をいただき、ありがとうございました。

ダンスコンテスト運営事務局`
  },
  {
    id: 'general',
    name: '一般通知',
    subject: '【ダンスコンテスト】お知らせ - {{name}}様',
    body: `{{name}}様

お疲れ様です。
ダンスコンテスト運営事務局です。

■ エントリー情報
・ダンススタイル: {{dance_style}}
・チーム名: {{team_name}}
・参加者名: {{participant_names}}

（こちらにメッセージを記載してください）

引き続きよろしくお願いいたします。

ダンスコンテスト運営事務局`
  }
]

export default function EmailComposer({ selectedEntries, entries, onClose, onSent }: EmailComposerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)

  const selectedEntriesData = entries.filter(entry => selectedEntries.includes(entry.id))

  // テンプレートをデータベースから取得
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/admin/notification-templates')
        if (response.ok) {
          const data = await response.json()
          setTemplates(data.filter((t: NotificationTemplate) => t.is_active))
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error)
      } finally {
        setTemplatesLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    
    // データベースからのテンプレートを優先、フォールバックとしてデフォルトテンプレートを使用
    const dbTemplate = templates.find(t => t.id === templateId)
    const defaultTemplate = defaultTemplates.find(t => t.id === templateId)
    const template = dbTemplate || defaultTemplate
    
    if (template) {
      setSubject(template.subject)
      setBody(template.body)
    }
  }

  const getVariableHelp = () => {
    return [
      { variable: '{{name}}', description: '参加者名' },
      { variable: '{{email}}', description: 'メールアドレス' },
      { variable: '{{dance_style}}', description: 'ダンススタイル' },
      { variable: '{{representative_name}}', description: '代表者名' },
      { variable: '{{partner_name}}', description: 'パートナ名' },
      { variable: '{{team_name}}', description: 'チーム名（個人参加の場合は「個人参加」）' },
      { variable: '{{participant_names}}', description: '参加者名一覧' },
      { variable: '{{status}}', description: '現在のステータス' },
      { variable: '{{competition_name}}', description: 'コンペティション名' },
      { variable: '{{organization_name}}', description: '主催者名' }
    ]
  }

  const replaceVariables = (text: string, entry: typeof selectedEntriesData[0]) => {
    return text
      .replace(/\{\{name\}\}/g, entry.users.name)
      .replace(/\{\{email\}\}/g, entry.users.email)
      .replace(/\{\{dance_style\}\}/g, entry.dance_style)
      .replace(/\{\{representative_name\}\}/g, entry.representative_name || entry.users.name)
      .replace(/\{\{partner_name\}\}/g, entry.partner_name || 'パートナ名未設定')
      .replace(/\{\{team_name\}\}/g, entry.team_name || '個人参加')
      .replace(/\{\{participant_names\}\}/g, entry.participant_names)
      .replace(/\{\{status\}\}/g, getStatusText(entry.status))
      .replace(/\{\{competition_name\}\}/g, 'ダンスコンペティション')
      .replace(/\{\{organization_name\}\}/g, 'ダンスコンペティション運営事務局')
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '未処理'
      case 'submitted': return '提出済み'
      case 'selected': return '選考通過'
      case 'rejected': return '不選考'
      default: return '未設定'
    }
  }

  const handleSendEmails = async () => {
    if (!subject.trim() || !body.trim()) {
      alert('件名とメール本文を入力してください')
      return
    }

    if (!confirm(`${selectedEntriesData.length}名にメールを送信しますか？`)) {
      return
    }

    setSending(true)

    try {
      // メール送信APIを呼び出し
      const emailData = selectedEntriesData.map(entry => ({
        to: entry.users.email,
        subject: replaceVariables(subject, entry),
        body: replaceVariables(body, entry),
        entryId: entry.id
      }))

      const response = await fetch('/api/admin/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: emailData }),
      })

      if (!response.ok) {
        throw new Error('メール送信に失敗しました')
      }

      alert('メールの送信が完了しました')
      onSent()
      onClose()
    } catch (error) {
      console.error('Email sending error:', error)
      alert('メール送信に失敗しました')
    } finally {
      setSending(false)
    }
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側：メール作成 */}
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
                      {template.name} ({template.category})
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

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">利用可能な変数</h4>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  {getVariableHelp().map(help => (
                    <div key={help.variable} className="flex justify-between">
                      <code className="text-blue-700 font-mono">{help.variable}</code>
                      <span className="text-blue-600">{help.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 右側：送信先一覧とプレビュー */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  送信先一覧 ({selectedEntriesData.length}名)
                </h4>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                  {selectedEntriesData.map(entry => (
                    <div key={entry.id} className="p-2 border-b border-gray-100 last:border-b-0">
                      <div className="text-sm font-medium">{entry.users.name}</div>
                      <div className="text-xs text-gray-500">{entry.users.email}</div>
                      <div className="text-xs text-gray-400">{entry.dance_style}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedEntriesData.length > 0 && subject && body && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    プレビュー ({selectedEntriesData[0].users.name}さんの場合)
                  </h4>
                  <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                    <div className="mb-2">
                      <strong>件名:</strong> {replaceVariables(subject, selectedEntriesData[0])}
                    </div>
                    <div className="whitespace-pre-wrap text-sm">
                      {replaceVariables(body, selectedEntriesData[0])}
                    </div>
                  </div>
                </div>
              )}
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
              onClick={handleSendEmails}
              disabled={sending || !subject.trim() || !body.trim() || selectedEntriesData.length === 0}
              className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? '送信中...' : `メール送信 (${selectedEntriesData.length}名)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}