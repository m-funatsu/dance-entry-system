'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import FileList from '@/components/FileList'
import { uploadFile as uploadFileToStorage } from '@/lib/storage'
import type { Entry, User, EntryFile } from '@/lib/types'

interface IntegratedEntryFormProps {
  userId: string
  existingEntry: Entry | null
  existingFiles: EntryFile[]
  userProfile: User
}

type FormSection = 'basic' | 'music' | 'additional' | 'optional'

interface FormData {
  // 基本情報
  dance_style: string
  team_name: string
  representative_name: string
  representative_furigana: string
  partner_name: string
  partner_furigana: string
  phone_number: string
  emergency_contact: string
  agreement_checked: boolean
  
  // 楽曲情報
  use_different_songs: boolean
  
  // 追加情報
  choreographer: string
  choreographer_furigana: string
  story: string
  
  // ファイル
  photo?: File
  music?: File
  music2?: File
  video?: File
}

export default function IntegratedEntryForm({ userId, existingEntry, userProfile }: IntegratedEntryFormProps) {
  const [activeSection, setActiveSection] = useState<FormSection>('basic')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sectionLoading, setSectionLoading] = useState<Record<string, boolean>>({})
  const [sectionSaved, setSectionSaved] = useState<Record<string, boolean>>({})
  const [entryId, setEntryId] = useState<string>(existingEntry?.id || '')
  const [fileListRefreshKey, setFileListRefreshKey] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, number>>({
    photo: 0,
    video: 0,
    music: 0
  })
  
  const [formData, setFormData] = useState<FormData>({
    dance_style: existingEntry?.dance_style || '',
    team_name: existingEntry?.team_name || '',
    representative_name: existingEntry?.representative_name || '',
    representative_furigana: existingEntry?.representative_furigana || '',
    partner_name: existingEntry?.partner_name || '',
    partner_furigana: existingEntry?.partner_furigana || '',
    phone_number: existingEntry?.phone_number || '',
    emergency_contact: existingEntry?.emergency_contact || '',
    use_different_songs: false,
    choreographer: existingEntry?.choreographer || '',
    choreographer_furigana: existingEntry?.choreographer_furigana || '',
    story: existingEntry?.story || '',
    agreement_checked: existingEntry?.agreement_checked || false,
  })

  const sections: { id: FormSection; label: string; required?: boolean }[] = [
    { id: 'basic', label: '基本情報', required: true },
    { id: 'music', label: '楽曲情報', required: true },
    { id: 'additional', label: '追加情報' },
    { id: 'optional', label: '任意申請' },
  ]

  // アップロード済みファイル数を取得
  const fetchUploadedFileCounts = useCallback(async () => {
    if (!entryId) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('entry_files')
      .select('file_type')
      .eq('entry_id', entryId)

    if (!error && data) {
      const counts = data.reduce((acc, file) => {
        const type = file.file_type as 'photo' | 'video' | 'music' | 'audio'
        const key = type === 'audio' ? 'music' : type
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      setUploadedFiles({
        photo: counts.photo || 0,
        video: counts.video || 0,
        music: (counts.music || 0) + (counts.audio || 0)
      })
    }
  }, [entryId])

  useEffect(() => {
    fetchUploadedFileCounts()
  }, [fetchUploadedFileCounts, fileListRefreshKey])

  const validateSection = (section: FormSection): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (section) {
      case 'basic':
        if (!formData.dance_style) newErrors.dance_style = 'ダンスジャンルを選択してください'
        if (!formData.phone_number) newErrors.phone_number = '電話番号を入力してください'
        if (!formData.emergency_contact) newErrors.emergency_contact = '緊急連絡先を入力してください'
        if (!formData.agreement_checked) newErrors.agreement = '参加資格への同意が必要です'
        break
      case 'music':
        // 楽曲情報の必須項目なし（ファイルは別途チェック）
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSectionChange = (section: FormSection) => {
    const currentIndex = sections.findIndex(s => s.id === activeSection)
    const targetIndex = sections.findIndex(s => s.id === section)
    
    // 前のセクションに戻る場合は検証不要
    if (targetIndex < currentIndex) {
      setActiveSection(section)
      return
    }
    
    // 必須セクションの検証
    if (sections[currentIndex].required && !validateSection(activeSection)) {
      return
    }
    
    setActiveSection(section)
  }

  const handleFileChange = (field: 'photo' | 'music' | 'music2' | 'video', file: File | undefined) => {
    setFormData(prev => ({ ...prev, [field]: file }))
  }

  const getFilePreview = (file: File | undefined, type: 'photo' | 'music' | 'video') => {
    if (!file) return null

    const objectUrl = URL.createObjectURL(file)

    if (type === 'photo') {
      return (
        <div className="mt-2">
          <div className="max-w-full max-h-64 bg-gray-100 rounded overflow-hidden">
            <img
              src={objectUrl}
              alt={file.name}
              className="max-w-full max-h-64 object-contain rounded"
              onLoad={() => URL.revokeObjectURL(objectUrl)}
            />
          </div>
        </div>
      )
    }

    if (type === 'video') {
      return (
        <div className="mt-2">
          <video
            src={objectUrl}
            controls
            className="max-w-full max-h-64 rounded"
            onLoadedData={() => URL.revokeObjectURL(objectUrl)}
          >
            お使いのブラウザは動画再生に対応していません。
          </video>
        </div>
      )
    }

    if (type === 'music') {
      return (
        <div className="mt-2">
          <audio
            src={objectUrl}
            controls
            className="w-full"
            onLoadedData={() => URL.revokeObjectURL(objectUrl)}
          >
            お使いのブラウザは音声再生に対応していません。
          </audio>
        </div>
      )
    }

    return null
  }

  const handleSaveSection = async (section: FormSection) => {
    // バリデーション
    if (!validateSection(section)) {
      return
    }

    setSectionLoading({ ...sectionLoading, [section]: true })
    setErrors({})

    try {
      const supabase = createClient()
      
      // エントリーデータの準備
      let updateData: Record<string, unknown> = {}
      
      switch (section) {
        case 'basic':
          updateData = {
            dance_style: formData.dance_style,
            team_name: formData.team_name,
            participant_names: '',
            representative_name: formData.representative_name,
            representative_furigana: formData.representative_furigana,
            partner_name: formData.partner_name,
            partner_furigana: formData.partner_furigana,
            phone_number: formData.phone_number,
            emergency_contact: formData.emergency_contact,
            agreement_checked: formData.agreement_checked,
          }
          break
        case 'music':
          // 楽曲情報はファイルのみなので、ファイルアップロード処理を実行
          if (formData.photo || formData.video || formData.music || formData.music2) {
            await handleFilesUpload()
          }
          setSectionSaved({ ...sectionSaved, [section]: true })
          setSectionLoading({ ...sectionLoading, [section]: false })
          return
        case 'additional':
          updateData = {
            choreographer: formData.choreographer,
            choreographer_furigana: formData.choreographer_furigana,
            story: formData.story,
          }
          break
      }

      // 既存エントリーがない場合は新規作成
      if (!entryId) {
        const { data, error } = await supabase
          .from('entries')
          .insert({
            user_id: userId,
            ...updateData,
            music_title: '',
            status: userProfile.has_seed ? 'selected' : 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
        
        if (error) throw error
        setEntryId(data.id)
      } else {
        // 既存エントリーの更新
        const { error } = await supabase
          .from('entries')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', entryId)
        
        if (error) throw error
      }

      setSectionSaved({ ...sectionSaved, [section]: true })
    } catch (error) {
      console.error('Error saving section:', error)
      setErrors({ submit: `${section}の保存中にエラーが発生しました` })
    } finally {
      setSectionLoading({ ...sectionLoading, [section]: false })
    }
  }

  const handleFilesUpload = async () => {
    if (!entryId) {
      setErrors({ submit: '基本情報を先に保存してください' })
      return
    }

    const uploadPromises = []
    if (formData.photo) {
      uploadPromises.push(uploadFile(formData.photo, 'photo', entryId))
    }
    if (formData.music) {
      uploadPromises.push(uploadFile(formData.music, 'music', entryId))
    }
    if (formData.video) {
      uploadPromises.push(uploadFile(formData.video, 'video', entryId))
    }
    if (formData.use_different_songs && formData.music2) {
      uploadPromises.push(uploadFile(formData.music2, 'music', entryId))
    }

    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises)
      // ファイルリストを更新
      setFileListRefreshKey(prev => prev + 1)
    }
  }

  const uploadFile = async (file: File, fileType: 'photo' | 'music' | 'video', uploadEntryId: string) => {
    const result = await uploadFileToStorage({
      userId: userId,
      entryId: uploadEntryId,
      fileType: fileType,
      file: file
    })

    if (!result.success) {
      throw new Error(result.error || 'アップロードに失敗しました')
    }

    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // フォーム全体の送信は無効化（各セクションで個別保存するため）
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* タブナビゲーション */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionChange(section.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeSection === section.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {section.label}
                {section.required && <span className="text-red-500 ml-1">*</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-6 py-6">
          {/* 基本情報セクション */}
          {activeSection === 'basic' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ダンスジャンル <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.dance_style}
                  onChange={(e) => setFormData(prev => ({ ...prev, dance_style: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">選択してください</option>
                  <option value="JAZZ">JAZZ</option>
                  <option value="HIPHOP">HIPHOP</option>
                  <option value="CONTEMPORARY">CONTEMPORARY</option>
                  <option value="その他">その他</option>
                </select>
                {errors.dance_style && <p className="mt-1 text-sm text-red-600">{errors.dance_style}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  チーム名
                </label>
                <input
                  type="text"
                  value={formData.team_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    代表者名
                  </label>
                  <input
                    type="text"
                    value={formData.representative_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, representative_name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    代表者フリガナ
                  </label>
                  <input
                    type="text"
                    value={formData.representative_furigana}
                    onChange={(e) => setFormData(prev => ({ ...prev, representative_furigana: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    パートナー名
                  </label>
                  <input
                    type="text"
                    value={formData.partner_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, partner_name: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    パートナーフリガナ
                  </label>
                  <input
                    type="text"
                    value={formData.partner_furigana}
                    onChange={(e) => setFormData(prev => ({ ...prev, partner_furigana: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  緊急連絡先 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {errors.emergency_contact && <p className="mt-1 text-sm text-red-600">{errors.emergency_contact}</p>}
              </div>

              {/* 参加資格への同意 */}
              <div className="space-y-4 mt-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">参加資格</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• ペアにおける性別は問わない</p>
                    <p>• ペアの年齢合計は20歳以上90歳未満とする</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <input
                    id="agreement"
                    type="checkbox"
                    checked={formData.agreement_checked}
                    onChange={(e) => setFormData(prev => ({ ...prev, agreement_checked: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="agreement" className="ml-2 block text-sm text-gray-900">
                    上記の参加資格に同意します *
                  </label>
                </div>
                {errors.agreement && <p className="mt-1 text-sm text-red-600">{errors.agreement}</p>}
              </div>
              
              {/* 基本情報保存ボタン */}
              <div className="mt-6 flex justify-end space-x-3">
                {sectionSaved.basic && (
                  <span className="text-sm text-green-600">✓ 保存済み</span>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveSection('basic')}
                  disabled={sectionLoading.basic}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sectionLoading.basic ? '保存中...' : '基本情報を保存'}
                </button>
              </div>
            </div>
          )}

          {/* 楽曲情報セクション */}
          {activeSection === 'music' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">楽曲情報</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  写真 <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('photo', e.target.files?.[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {formData.photo && (
                  <>
                    <p className="mt-1 text-sm text-gray-600">選択: {formData.photo.name}</p>
                    {getFilePreview(formData.photo, 'photo')}
                  </>
                )}
              </div>

              {/* 写真のアップロード済みファイル */}
              {entryId && (
                <div className="mt-4 ml-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">アップロード済みの写真</h5>
                  <FileList 
                    entryId={entryId} 
                    fileType="photo"
                    editable={true}
                    refreshKey={fileListRefreshKey}
                    onFileDeleted={(fileId, fileType) => {
                      setFileListRefreshKey(prev => prev + 1)
                      setUploadedFiles(prev => ({
                        ...prev,
                        photo: Math.max(0, prev.photo - 1)
                      }))
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  動画 <span className="text-red-500">*</span>
                  {uploadedFiles.video > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      （{uploadedFiles.video}/1 アップロード済み）
                    </span>
                  )}
                </label>
                {uploadedFiles.video >= 1 && !formData.video ? (
                  <div className="p-4 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-600">
                      動画は既に1つアップロードされています。
                      新しい動画をアップロードする場合は、下のファイルリストから既存の動画を削除してください。
                    </p>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileChange('video', e.target.files?.[0])}
                      disabled={uploadedFiles.video >= 1}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {formData.video && (
                      <>
                        <p className="mt-1 text-sm text-gray-600">選択: {formData.video.name}</p>
                        {getFilePreview(formData.video, 'video')}
                      </>
                    )}
                  </>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  ※ 動画ファイルは200MBまでアップロード可能です（最大1ファイル）
                </p>
              </div>

              {/* 動画のアップロード済みファイル */}
              {entryId && (
                <div className="mt-4 ml-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">アップロード済みの動画</h5>
                  <FileList 
                    entryId={entryId} 
                    fileType="video"
                    editable={true}
                    refreshKey={fileListRefreshKey}
                    onFileDeleted={(fileId, fileType) => {
                      setFileListRefreshKey(prev => prev + 1)
                      setUploadedFiles(prev => ({
                        ...prev,
                        video: Math.max(0, prev.video - 1)
                      }))
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  楽曲ファイル（音源） <span className="text-red-500">*</span>
                  {uploadedFiles.music > 0 && (
                    <span className="ml-2 text-sm text-gray-500">
                      （{uploadedFiles.music}/2 アップロード済み）
                    </span>
                  )}
                </label>
                {uploadedFiles.music >= 2 && !formData.music && !formData.use_different_songs ? (
                  <div className="p-4 bg-gray-100 rounded-md">
                    <p className="text-sm text-gray-600">
                      音源は既に2つアップロードされています。
                      新しい音源をアップロードする場合は、下のファイルリストから既存の音源を削除してください。
                    </p>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileChange('music', e.target.files?.[0])}
                      disabled={uploadedFiles.music >= 2}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {formData.music && (
                      <>
                        <p className="mt-1 text-sm text-gray-600">選択: {formData.music.name}</p>
                        {getFilePreview(formData.music, 'music')}
                      </>
                    )}
                  </>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  ※ この音源は準決勝・決勝共通で使用されます
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    id="use_different_songs"
                    type="checkbox"
                    checked={formData.use_different_songs}
                    onChange={(e) => setFormData(prev => ({ ...prev, use_different_songs: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="use_different_songs" className="ml-2 block text-sm text-gray-900">
                    準決勝と決勝で異なる曲を使用する場合
                  </label>
                </div>
                
                {formData.use_different_songs && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      決勝用楽曲ファイル（音源） <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileChange('music2', e.target.files?.[0])}
                      disabled={uploadedFiles.music >= 2}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {formData.music2 && (
                      <>
                        <p className="mt-1 text-sm text-gray-600">選択: {formData.music2.name}</p>
                        {getFilePreview(formData.music2, 'music')}
                      </>
                    )}
                    {uploadedFiles.music >= 1 && (
                      <p className="mt-2 text-sm text-yellow-600">
                        ※ 音源は最大2つまでです。既に{uploadedFiles.music}つアップロード済みです。
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 音源のアップロード済みファイル */}
              {entryId && (
                <div className="mt-8">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">アップロード済みの音源</h5>
                  <div className="space-y-4">
                    <div className="ml-4">
                      <FileList 
                        entryId={entryId} 
                        fileType="music"
                        editable={true}
                        refreshKey={fileListRefreshKey}
                        onFileDeleted={(fileId, fileType) => {
                          setFileListRefreshKey(prev => prev + 1)
                          setUploadedFiles(prev => ({
                            ...prev,
                            music: Math.max(0, prev.music - 1)
                          }))
                        }}
                      />
                      {uploadedFiles.music > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          ※ 音源がアップロードされた順に表示されています。
                          {formData.use_different_songs ? '1つ目が準決勝用、2つ目が決勝用です。' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 楽曲情報保存ボタン */}
              <div className="mt-6 flex justify-end space-x-3">
                {!entryId && (
                  <p className="text-sm text-red-600">※ 基本情報を先に保存してください</p>
                )}
                {sectionSaved.music && (
                  <span className="text-sm text-green-600">✓ 保存済み</span>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveSection('music')}
                  disabled={sectionLoading.music || !entryId}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sectionLoading.music ? 'アップロード中...' : '楽曲情報を保存'}
                </button>
              </div>
            </div>
          )}

          {/* 追加情報セクション */}
          {activeSection === 'additional' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">追加情報</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    振付師
                  </label>
                  <input
                    type="text"
                    value={formData.choreographer}
                    onChange={(e) => setFormData(prev => ({ ...prev, choreographer: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    振付師フリガナ
                  </label>
                  <input
                    type="text"
                    value={formData.choreographer_furigana}
                    onChange={(e) => setFormData(prev => ({ ...prev, choreographer_furigana: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ストーリー・作品説明
                </label>
                <textarea
                  value={formData.story}
                  onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="作品のストーリーや説明を入力してください"
                />
              </div>
              
              {/* 追加情報保存ボタン */}
              <div className="mt-6 flex justify-end space-x-3">
                {!entryId && (
                  <p className="text-sm text-red-600">※ 基本情報を先に保存してください</p>
                )}
                {sectionSaved.additional && (
                  <span className="text-sm text-green-600">✓ 保存済み</span>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveSection('additional')}
                  disabled={sectionLoading.additional || !entryId}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sectionLoading.additional ? '保存中...' : '追加情報を保存'}
                </button>
              </div>
            </div>
          )}

          {/* 任意申請セクション */}
          {activeSection === 'optional' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">任意申請</h3>
              <p className="text-sm text-gray-600">
                今後、任意の申請事項がある場合はこちらに表示されます。
              </p>
            </div>
          )}

          {/* エラー表示 */}
          {errors.submit && (
            <div className="mt-8 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}