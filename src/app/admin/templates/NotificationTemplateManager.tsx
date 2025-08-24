'use client'

import { useState, useEffect } from 'react'
import type { NotificationTemplate } from '@/lib/types'

export default function NotificationTemplateManager() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    body: '',
    is_active: true,
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      console.log('通知テンプレート取得開始...')
      const response = await fetch('/api/admin/notification-templates')
      console.log('API レスポンス:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('取得したテンプレートデータ:', data)
        console.log('テンプレート件数:', data?.length || 0)
        setTemplates(data)
      } else {
        console.error('API エラー:', response.status)
        setError('テンプレートの取得に失敗しました')
      }
    } catch (error) {
      console.error('フェッチエラー:', error)
      setError('テンプレートの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const url = editingTemplate 
        ? `/api/admin/notification-templates/${editingTemplate.id}`
        : '/api/admin/notification-templates'
      
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchTemplates()
        resetForm()
      } else {
        setError('保存に失敗しました')
      }
    } catch {
      setError('保存に失敗しました')
    }
  }

  const handleEdit = (template: NotificationTemplate) => {
    console.log('編集ボタンクリック:', template.id, template.name)
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      subject: template.subject,
      body: template.body,
      is_active: template.is_active,
    })
    setIsCreating(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このテンプレートを削除してもよろしいですか？')) return

    try {
      const response = await fetch(`/api/admin/notification-templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTemplates()
      } else {
        setError('削除に失敗しました')
      }
    } catch {
      setError('削除に失敗しました')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      subject: '',
      body: '',
      is_active: true,
    })
    setEditingTemplate(null)
    setIsCreating(false)
    setError('')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">通知テンプレート一覧</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          新規テンプレート作成
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* テンプレート作成・編集フォーム */}
      {isCreating && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingTemplate ? 'テンプレート編集' : '新規テンプレート作成'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                テンプレート名 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="選考結果通知（合格）"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                説明
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="このテンプレートの用途"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                件名 *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="【バルカーカップ】選考結果のお知らせ"
              />
            </div>

            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700">
                本文 *
              </label>
              <textarea
                id="body"
                name="body"
                required
                rows={10}
                value={formData.body}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="メール本文を入力してください..."
              />
            </div>

            <div className="flex items-center">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                アクティブ
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {editingTemplate ? '更新' : '作成'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* テンプレート一覧 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" style={{minWidth: '800px'}}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                テンプレート名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                件名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '120px', minWidth: '120px'}}>
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.map((template) => (
              <tr key={template.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    {template.description && (
                      <div className="text-sm text-gray-500">{template.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {template.subject}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    template.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {template.is_active ? 'アクティブ' : '無効'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{width: '120px', minWidth: '120px'}}>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs font-medium"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-sm text-gray-500">テンプレートがありません</div>
          </div>
        )}
      </div>
    </div>
  )
}