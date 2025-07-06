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
  const [uploading, setUploading] = useState<string | null>(null)
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

  const handleFileUpload = async (file: File, settingKey: string) => {
    setUploading(settingKey)
    setError('')
    
    try {
      const supabase = createAdminClient()
      
      // ファイル名を生成
      const fileExt = file.name.split('.').pop()
      const fileName = `background_${settingKey}_${Date.now()}.${fileExt}`
      const filePath = `backgrounds/${fileName}`
      
      // ファイルをアップロード
      const { error: uploadError } = await supabase.storage
        .from('entries')
        .upload(filePath, file)
        
      if (uploadError) {
        setError('画像のアップロードに失敗しました')
        return
      }
      
      // 公開URLを取得
      const { data: publicUrl } = supabase.storage
        .from('entries')
        .getPublicUrl(filePath)
        
      // 設定を更新
      setSettings(prev => ({
        ...prev,
        [settingKey]: publicUrl.publicUrl
      }))
      
    } catch (error) {
      console.error('File upload error:', error)
      setError('画像のアップロードに失敗しました')
    } finally {
      setUploading(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, settingKey: string) => {
    const file = e.target.files?.[0]
    if (file) {
      // 画像ファイルのみ許可
      if (!file.type.startsWith('image/')) {
        setError('画像ファイルのみアップロード可能です')
        return
      }
      
      // ファイルサイズ制限（5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('ファイルサイズは5MB以下にしてください')
        return
      }
      
      handleFileUpload(file, settingKey)
    }
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
          <div key={key} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            
            {/* URL入力 */}
            <div>
              <label htmlFor={key} className="block text-xs font-medium text-gray-600 mb-1">
                URL指定
              </label>
              <input
                type="url"
                id={key}
                name={key}
                value={settings[key as keyof typeof settings]}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            {/* ファイルアップロード */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ファイルアップロード
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, key)}
                disabled={uploading === key}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
              />
              {uploading === key && (
                <p className="mt-1 text-sm text-blue-600">アップロード中...</p>
              )}
            </div>
            
            <p className="text-sm text-gray-500">{description}</p>
            
            {/* プレビュー */}
            {settings[key as keyof typeof settings] && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">プレビュー</label>
                <div 
                  className="h-32 w-full rounded-md border border-gray-300"
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
          <li>• <strong>URL指定</strong>: 外部画像のURLを入力（https://で始まるURL）</li>
          <li>• <strong>ファイルアップロード</strong>: ローカルファイルから画像を選択してアップロード</li>
          <li>• 推奨サイズ: 1920x1080px以上</li>
          <li>• 対応形式: JPG, PNG, WebP, GIF</li>
          <li>• ファイルサイズ: 5MB以下</li>
          <li>• 設定後、各画面で背景画像が表示されます</li>
        </ul>
      </div>
    </div>
  )
}