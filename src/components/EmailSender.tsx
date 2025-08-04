'use client'

import { useState } from 'react'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import type { EmailTemplateData } from '@/lib/types'

interface EmailSenderProps {
  recipientEmail: string
  recipientName: string
  entryData?: Partial<EmailTemplateData>
}

export default function EmailSender({ recipientEmail, recipientName, entryData }: EmailSenderProps) {
  const [sending, setSending] = useState(false)
  const [templateId, setTemplateId] = useState('entry-confirmation')
  const { handleError } = useErrorHandler()

  const sendEmail = async () => {
    setSending(true)

    try {
      const emailData = {
        to: recipientEmail,
        subject: getSubjectByTemplate(templateId),
        templateId,
        data: {
          name: recipientName,
          ...entryData
        }
      }

      const response = await fetch('/api/admin/send-custom-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.error || 'メール送信に失敗しました'
        handleError(new Error(errorMessage), {
          fallbackMessage: errorMessage,
          showToast: true
        })
        alert(errorMessage)
        return
      }

      alert('メールを送信しました')
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'メール送信中にエラーが発生しました',
        showToast: true
      })
      alert('メール送信中にエラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  const getSubjectByTemplate = (templateId: string): string => {
    const subjects: Record<string, string> = {
      'entry-confirmation': 'エントリー受付確認',
      'selection-result': '選考結果のお知らせ',
      'deadline-reminder': '提出期限のお知らせ'
    }
    return subjects[templateId] || 'お知らせ'
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          メールテンプレート
        </label>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="entry-confirmation">エントリー確認</option>
          <option value="selection-result">選考結果</option>
          <option value="deadline-reminder">期限リマインダー</option>
        </select>
      </div>

      <button
        onClick={sendEmail}
        disabled={sending}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {sending ? '送信中...' : 'メールを送信'}
      </button>
    </div>
  )
}