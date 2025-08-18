'use client'

import React from 'react'
import FileList from '@/components/FileList'
import { FileUploadField } from '@/components/ui/FileUploadField'

interface MusicInfoSectionProps {
  formData: {
    use_different_songs: boolean
    photo?: File
    photoUrl?: string
    music?: File
    musicUrl?: string
    music2?: File
    music2Url?: string
    video?: File
    videoUrl?: string
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
  onFileUploaded?: (field: string, url: string) => void
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
  onFileUploaded,
  onFileDeleted
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">楽曲情報</h3>

      <div>
        <FileUploadField
          label="写真"
          required
          value={formData.photoUrl}
          onChange={(file) => onFileChange('photo', file)}
          onUploadComplete={onFileUploaded ? (url) => onFileUploaded('photo', url) : undefined}
          category="image"
          disabled={!entryId}
          maxSizeMB={100}
          accept="image/*"
          uploadPath={entryId ? (fileName) => `${entryId}/photo/${fileName}` : undefined}
        />
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
        {uploadedFiles.video >= 1 && !formData.video ? (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              動画 <span className="text-red-500">*</span>
              <span className="ml-2 text-sm text-gray-500">
                （{uploadedFiles.video}/1 アップロード済み）
              </span>
            </label>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-600">
                動画は既に1つアップロードされています。
                新しい動画をアップロードする場合は、下のファイルリストから既存の動画を削除してください。
              </p>
            </div>
          </>
        ) : (
          <FileUploadField
            label="動画"
            required
            value={formData.videoUrl}
            onChange={(file) => onFileChange('video', file)}
            onUploadComplete={onFileUploaded ? (url) => onFileUploaded('video', url) : undefined}
            category="video"
            disabled={!entryId || uploadedFiles.video >= 1}
            maxSizeMB={250}
            accept="video/*"
            uploadPath={entryId ? (fileName) => `${entryId}/video/${fileName}` : undefined}
            placeholder={{
              formats: "※ 動画ファイルは250MBまでアップロード可能です（最大1ファイル）"
            }}
          />
        )}
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
        {uploadedFiles.music >= (formData.use_different_songs ? 2 : 1) && !formData.music ? (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              楽曲ファイル {formData.use_different_songs ? '（準決勝用）' : ''} <span className="text-red-500">*</span>
              {uploadedFiles.music > 0 && !formData.use_different_songs && (
                <span className="ml-2 text-sm text-gray-500">
                  （{uploadedFiles.music}/1 アップロード済み）
                </span>
              )}
            </label>
            <div className="p-4 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-600">
                楽曲ファイルは既に必要数アップロードされています。
                新しい楽曲をアップロードする場合は、下のファイルリストから既存のファイルを削除してください。
              </p>
            </div>
          </>
        ) : (
          <FileUploadField
            label={`楽曲ファイル${formData.use_different_songs ? ' （準決勝用）' : ''}`}
            required
            value={formData.musicUrl}
            onChange={(file) => onFileChange('music', file)}
            onUploadComplete={onFileUploaded ? (url) => onFileUploaded('music', url) : undefined}
            category="audio"
            disabled={!entryId || (!formData.use_different_songs && uploadedFiles.music >= 1)}
            maxSizeMB={100}
            accept="audio/*"
            uploadPath={entryId ? (fileName) => `${entryId}/music/${fileName}` : undefined}
          />
        )}
      </div>

      {formData.use_different_songs && (
        <FileUploadField
          label="楽曲ファイル（決勝用）"
          required
          value={formData.music2Url}
          onChange={(file) => onFileChange('music2', file)}
          onUploadComplete={onFileUploaded ? (url) => onFileUploaded('music2', url) : undefined}
          category="audio"
          disabled={!entryId}
          maxSizeMB={100}
          accept="audio/*"
          uploadPath={entryId ? (fileName) => `${entryId}/music2/${fileName}` : undefined}
        />
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