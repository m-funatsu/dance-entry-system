'use client'

import React from 'react'
import FileList from '@/components/FileList'

interface MusicInfoSectionProps {
  formData: {
    use_different_songs: boolean
    photo?: File
    music?: File
    music2?: File
    video?: File
  }
  errors: Record<string, string>
  entryId: string
  uploadedFiles: {
    photo: number
    video: number
    music: number
  }
  fileListRefreshKey: number
  onChange: (field: string, value: boolean) => void
  onFileChange: (field: string, file: File | undefined) => void
  onFileDeleted: (fileType: string) => void
  getFilePreview: (file: File, type: string) => React.ReactNode
}

export const MusicInfoSection: React.FC<MusicInfoSectionProps> = ({
  formData,
  entryId,
  uploadedFiles,
  fileListRefreshKey,
  onChange,
  onFileChange,
  onFileDeleted,
  getFilePreview
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">楽曲情報</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          写真 <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFileChange('photo', e.target.files?.[0])}
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
            onFileDeleted={() => onFileDeleted('photo')}
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
              onChange={(e) => onFileChange('video', e.target.files?.[0])}
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
            onFileDeleted={() => onFileDeleted('video')}
          />
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="use-different-songs"
            checked={formData.use_different_songs}
            onChange={(e) => onChange('use_different_songs', e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="use-different-songs" className="ml-2 block text-sm text-gray-900">
            準決勝と決勝で異なる楽曲を使用する
          </label>
        </div>
        <p className="mt-1 text-sm text-gray-600 ml-6">
          ※ チェックを入れると、2曲分の楽曲ファイルをアップロードできます
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          楽曲ファイル {formData.use_different_songs ? '（準決勝用）' : ''} <span className="text-red-500">*</span>
          {uploadedFiles.music > 0 && !formData.use_different_songs && (
            <span className="ml-2 text-sm text-gray-500">
              （{uploadedFiles.music}/1 アップロード済み）
            </span>
          )}
        </label>
        {uploadedFiles.music >= (formData.use_different_songs ? 2 : 1) && !formData.music ? (
          <div className="p-4 bg-gray-100 rounded-md">
            <p className="text-sm text-gray-600">
              楽曲ファイルは既に必要数アップロードされています。
              新しい楽曲をアップロードする場合は、下のファイルリストから既存のファイルを削除してください。
            </p>
          </div>
        ) : (
          <>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => onFileChange('music', e.target.files?.[0])}
              disabled={!formData.use_different_songs && uploadedFiles.music >= 1}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {formData.music && <p className="mt-1 text-sm text-gray-600">選択: {formData.music.name}</p>}
          </>
        )}
      </div>

      {formData.use_different_songs && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            楽曲ファイル（決勝用） <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => onFileChange('music2', e.target.files?.[0])}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {formData.music2 && <p className="mt-1 text-sm text-gray-600">選択: {formData.music2.name}</p>}
        </div>
      )}

      {/* 楽曲のアップロード済みファイル */}
      {entryId && (
        <div className="mt-4 ml-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">アップロード済みの楽曲</h5>
          <FileList 
            entryId={entryId} 
            fileType="music"
            editable={true}
            refreshKey={fileListRefreshKey}
            onFileDeleted={() => onFileDeleted('music')}
          />
        </div>
      )}
    </div>
  )
}