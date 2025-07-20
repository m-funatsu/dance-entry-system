// ファイルアップロードのセキュリティ検証

// ファイルのマジックナンバー（ファイルシグネチャ）による検証
const FILE_SIGNATURES = {
  // 画像ファイル
  'image/jpeg': [
    { offset: 0, signature: [0xFF, 0xD8, 0xFF] } // JPEG
  ],
  'image/png': [
    { offset: 0, signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] } // PNG
  ],
  'image/gif': [
    { offset: 0, signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { offset: 0, signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }  // GIF89a
  ],
  // 音声ファイル
  'audio/mpeg': [
    { offset: 0, signature: [0xFF, 0xFB] }, // MP3
    { offset: 0, signature: [0xFF, 0xF3] }, // MP3
    { offset: 0, signature: [0xFF, 0xF2] }, // MP3
    { offset: 0, signature: [0x49, 0x44, 0x33] } // ID3
  ],
  'audio/wav': [
    { offset: 0, signature: [0x52, 0x49, 0x46, 0x46] } // RIFF
  ],
  'audio/aac': [
    { offset: 0, signature: [0xFF, 0xF1] }, // AAC
    { offset: 0, signature: [0xFF, 0xF9] }  // AAC
  ],
  // 動画ファイル
  'video/mp4': [
    { offset: 4, signature: [0x66, 0x74, 0x79, 0x70] } // ftyp
  ],
  'video/quicktime': [
    { offset: 4, signature: [0x66, 0x74, 0x79, 0x70] } // ftyp
  ],
  'video/avi': [
    { offset: 0, signature: [0x52, 0x49, 0x46, 0x46] } // RIFF
  ]
}

// ファイルのバイナリをチェックしてMIMEタイプを検証
export async function validateFileSignature(file: File): Promise<boolean> {
  const mimeType = file.type
  const signatures = FILE_SIGNATURES[mimeType as keyof typeof FILE_SIGNATURES]
  
  if (!signatures) {
    return false // サポートされていないファイルタイプ
  }

  // ファイルの先頭部分を読み取る
  const buffer = await file.slice(0, 20).arrayBuffer()
  const bytes = new Uint8Array(buffer)

  // シグネチャをチェック
  return signatures.some(sig => {
    const { offset, signature } = sig
    if (offset + signature.length > bytes.length) return false
    
    return signature.every((byte, index) => bytes[offset + index] === byte)
  })
}

// ファイル名のサニタイズ（パストラバーサル攻撃対策）
export function sanitizeFileName(fileName: string): string {
  // 危険な文字を除去
  const dangerousChars = /[<>:"|?*\x00-\x1F\\\/]/g
  const sanitized = fileName.replace(dangerousChars, '_')
  
  // 相対パスやドットファイルを防ぐ
  const parts = sanitized.split('/')
  const safeName = parts[parts.length - 1]
  
  // ドットで始まるファイル名を防ぐ
  if (safeName.startsWith('.')) {
    return `file_${safeName}`
  }
  
  // 最大長を制限
  const maxLength = 255
  if (safeName.length > maxLength) {
    const ext = safeName.split('.').pop() || ''
    const baseName = safeName.substring(0, maxLength - ext.length - 1)
    return `${baseName}.${ext}`
  }
  
  return safeName
}

// ファイルサイズの検証
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

// 許可されたMIMEタイプの検証
export function validateMimeType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType)
}

// 総合的なファイル検証
export async function validateFile(
  file: File,
  fileType: 'music' | 'audio' | 'photo' | 'video',
  maxSizeMB: number
): Promise<{ valid: boolean; error?: string }> {
  // MIMEタイプのマッピング
  const allowedMimeTypes = {
    music: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac'],
    audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac'],
    photo: ['image/jpeg', 'image/jpg', 'image/png'],
    video: ['video/mp4', 'video/quicktime', 'video/avi', 'video/mov']
  }

  // 1. MIMEタイプチェック
  const allowedTypes = allowedMimeTypes[fileType]
  if (!validateMimeType(file.type, allowedTypes)) {
    return { valid: false, error: '許可されていないファイル形式です' }
  }

  // 2. ファイルサイズチェック
  if (!validateFileSize(file, maxSizeMB)) {
    return { valid: false, error: `ファイルサイズが${maxSizeMB}MBを超えています` }
  }

  // 3. ファイルシグネチャチェック
  const isValidSignature = await validateFileSignature(file)
  if (!isValidSignature) {
    return { valid: false, error: 'ファイルの内容が不正です' }
  }

  // 4. ファイル名チェック
  const sanitizedName = sanitizeFileName(file.name)
  if (sanitizedName !== file.name) {
    // ファイル名に危険な文字が含まれている場合は警告
    console.warn('ファイル名に危険な文字が含まれていたため、サニタイズされました')
  }

  return { valid: true }
}