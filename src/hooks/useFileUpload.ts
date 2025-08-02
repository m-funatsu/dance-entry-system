import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseFileUploadOptions {
  bucketName?: string
  onSuccess?: (url: string, field?: string) => void
  onError?: (error: string) => void
}

export const useFileUpload = ({
  bucketName = 'files',
  onSuccess,
  onError
}: UseFileUploadOptions = {}) => {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadFile = async (file: File, path: string, field?: string): Promise<string | null> => {
    setUploading(true)
    setUploadError(null)

    try {
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(path, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(path)

      if (onSuccess) {
        onSuccess(publicUrl, field)
      }

      return publicUrl
    } catch (err) {
      console.error('ファイルアップロードエラー:', err)
      const errorMessage = err instanceof Error ? err.message : 'ファイルのアップロードに失敗しました'
      setUploadError(errorMessage)
      
      if (onError) {
        onError(errorMessage)
      }
      
      return null
    } finally {
      setUploading(false)
    }
  }

  const uploadImage = async (file: File, entryId: string, field: string): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      const error = '画像ファイルを選択してください'
      setUploadError(error)
      if (onError) onError(error)
      return null
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${entryId}/${field}_${Date.now()}.${fileExt}`
    
    return uploadFile(file, fileName, field)
  }

  const uploadVideo = async (file: File, entryId: string, field: string): Promise<string | null> => {
    if (!file.type.startsWith('video/')) {
      const error = '動画ファイルを選択してください'
      setUploadError(error)
      if (onError) onError(error)
      return null
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${entryId}/${field}_${Date.now()}.${fileExt}`
    
    return uploadFile(file, fileName, field)
  }

  const uploadAudio = async (file: File, entryId: string, field: string): Promise<string | null> => {
    if (!file.type.startsWith('audio/')) {
      const error = '音声ファイルを選択してください'
      setUploadError(error)
      if (onError) onError(error)
      return null
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${entryId}/${field}_${Date.now()}.${fileExt}`
    
    return uploadFile(file, fileName, field)
  }

  return {
    uploadFile,
    uploadImage,
    uploadVideo,
    uploadAudio,
    uploading,
    uploadError,
    setUploadError
  }
}