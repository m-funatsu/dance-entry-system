import { createClient } from '@/lib/supabase/client'

export const STORAGE_BUCKET = 'files'

export interface FileUploadOptions {
  userId: string
  entryId: string
  fileType: 'music' | 'audio' | 'photo' | 'video'
  file: File
}

export interface FileUploadResult {
  success: boolean
  error?: string
  fileId?: string
  filePath?: string
}

export async function uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
  const supabase = createClient()
  const { userId, entryId, fileType, file } = options

  if (!file) {
    return { success: false, error: 'ファイルが選択されていません' }
  }

  // 動画は200MB、その他は100MBまで
  const maxSizeInBytes = fileType === 'video' ? 200 * 1024 * 1024 : 100 * 1024 * 1024
  const maxSizeText = fileType === 'video' ? '200MB' : '100MB'

  if (file.size > maxSizeInBytes) {
    return { success: false, error: `ファイルサイズが${maxSizeText}を超えています` }
  }

  const allowedTypes = {
    music: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/mp3'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/mp3'],
    photo: ['image/jpeg', 'image/jpg', 'image/png'],
    video: ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime']
  }

  if (!allowedTypes[fileType].includes(file.type)) {
    return { success: false, error: '許可されていないファイル形式です' }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `${timestamp}-${file.name}`
  const filePath = `${userId}/${entryId}/${fileType}/${fileName}`

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { success: false, error: 'ファイルのアップロードに失敗しました' }
    }

    const { data: insertData, error: insertError } = await supabase
      .from('entry_files')
      .insert([
        {
          entry_id: entryId,
          file_type: fileType,
          file_name: file.name,
          file_path: data.path,
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath])
      return { success: false, error: 'ファイル情報の保存に失敗しました' }
    }

    return { 
      success: true, 
      fileId: insertData.id, 
      filePath: data.path 
    }

  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'ファイルのアップロードに失敗しました' }
  }
}

export async function getFileUrl(filePath: string): Promise<string | null> {
  const supabase = createClient()
  
  try {
    const { data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 3600)
    
    return data?.signedUrl || null
  } catch (error) {
    console.error('Get file URL error:', error)
    return null
  }
}

export async function deleteFile(fileId: string): Promise<boolean> {
  const supabase = createClient()
  
  try {
    const { data: fileData } = await supabase
      .from('entry_files')
      .select('file_path')
      .eq('id', fileId)
      .single()

    if (!fileData) {
      return false
    }

    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileData.file_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
    }

    const { error: dbError } = await supabase
      .from('entry_files')
      .delete()
      .eq('id', fileId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return false
    }

    return true
  } catch (error) {
    console.error('Delete file error:', error)
    return false
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIcon(fileType: string): string {
  switch (fileType) {
    case 'music':
    case 'audio':
      return '🎵'
    case 'photo':
      return '📷'
    case 'video':
      return '🎬'
    default:
      return '📄'
  }
}