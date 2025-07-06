'use client'

import { useState } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { useRouter } from 'next/navigation'

interface BackgroundSettingsProps {
  initialSettings: Record<string, string>
}

export default function BackgroundSettings({ initialSettings }: BackgroundSettingsProps) {
  const [settings, setSettings] = useState(() => ({
    login_background_image: initialSettings.login_background_image || '',
    dashboard_background_image: initialSettings.dashboard_background_image || '',
    entry_background_image: initialSettings.entry_background_image || '',
    music_background_image: initialSettings.music_background_image || '',
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createAdminClient()
      
      // 各設定を更新
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from('settings')
          .upsert({ key, value }, { onConflict: 'key' })
        
        if (error) {
          throw error
        }
      }

      setSuccess('背景画像設定を更新しました')
      
      // CSSカスタムプロパティを更新
      updateCSSVariables()
      
    } catch (error) {
      console.error('Settings update error:', error)
      setError('設定の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateCSSVariables = () => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      if (settings.login_background_image) {
        root.style.setProperty('--login-bg-image', `url(${settings.login_background_image})`)
      }
      if (settings.dashboard_background_image) {
        root.style.setProperty('--dashboard-bg-image', `url(${settings.dashboard_background_image})`)
      }
      if (settings.entry_background_image) {
        root.style.setProperty('--entry-bg-image', `url(${settings.entry_background_image})`)
      }
      if (settings.music_background_image) {
        root.style.setProperty('--music-bg-image', `url(${settings.music_background_image})`)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const backgroundPages = [
    { key: 'login_background_image', label: 'ログイン画面', description: 'ログインページの背景画像' },
    { key: 'dashboard_background_image', label: 'ダッシュボード画面', description: 'ダッシュボードページの背景画像' },
    { key: 'entry_background_image', label: 'エントリー画面', description: '基本情報入力ページの背景画像' },
    { key: 'music_background_image', label: '楽曲情報画面', description: '楽曲情報入力ページの背景画像' },
  ]

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {backgroundPages.map(({ key, label, description }) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            <input
              type="url"
              id={key}
              name={key}
              value={settings[key as keyof typeof settings]}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="https://example.com/image.jpg"
            />
            <p className="mt-1 text-sm text-gray-500">{description}</p>
            
            {/* プレビュー */}
            {settings[key as keyof typeof settings] && (
              <div className="mt-2">
                <div 
                  className="h-24 w-full rounded-md border border-gray-300"
                  style={{
                    backgroundImage: `url(${settings[key as keyof typeof settings]})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </div>
            )}
          </div>
        ))}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-green-700 text-sm">{success}</div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">使用方法:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 画像URLを入力してください（https://で始まるURL）</li>
          <li>• 推奨サイズ: 1920x1080px以上</li>
          <li>• 対応形式: JPG, PNG, WebP</li>
          <li>• 設定後、各画面で背景画像が表示されます</li>
        </ul>
      </div>
    </div>
  )
}