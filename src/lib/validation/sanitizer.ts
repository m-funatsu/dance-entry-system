import DOMPurify from 'isomorphic-dompurify'
import { logger } from '@/lib/logger'

// XSS対策: HTMLエスケープ
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// SQLインジェクション対策: 特殊文字のエスケープ
export function escapeSql(str: string): string {
  return str.replace(/['";\\]/g, '\\$&')
}

// ファイル名のサニタイズ
export function sanitizeFilename(filename: string): string {
  // 危険な文字を除去
  const sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Windows禁止文字
    .replace(/^\.+/, '') // 先頭のドットを除去
    .replace(/\.{2,}/g, '.') // 連続するドットを単一に
    .replace(/\s+/g, '_') // 空白をアンダースコアに
    .trim()

  // 最大長を制限
  const maxLength = 255
  if (sanitized.length > maxLength) {
    const ext = sanitized.split('.').pop() || ''
    const name = sanitized.substring(0, maxLength - ext.length - 1)
    return `${name}.${ext}`
  }

  return sanitized || 'unnamed_file'
}

// メールアドレスの検証とサニタイズ
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  
  if (!emailRegex.test(trimmed)) {
    logger.warn('無効なメールアドレス形式', {
      action: 'sanitize_email_invalid',
      metadata: { email: trimmed.substring(0, 50) } // 一部のみログ
    })
    return null
  }

  return trimmed
}

// 電話番号のサニタイズ
export function sanitizePhoneNumber(phone: string): string {
  // 数字とハイフンのみを残す
  return phone.replace(/[^\d-]/g, '')
}

// URLのサニタイズと検証
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    
    // 許可されたプロトコルのみ
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      logger.warn('許可されていないURLプロトコル', {
        action: 'sanitize_url_invalid_protocol',
        metadata: { protocol: parsed.protocol }
      })
      return null
    }

    return parsed.href
  } catch {
    logger.warn('無効なURL形式', {
      action: 'sanitize_url_invalid',
      metadata: { url: url.substring(0, 100) }
    })
    return null
  }
}

// HTML入力のサニタイズ（リッチテキスト用）
export function sanitizeHtml(html: string, options?: {
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
}): string {
  const defaultAllowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li']
  
  // DOMPurifyの設定
  if (options?.allowedTags) {
    DOMPurify.setConfig({ ALLOWED_TAGS: options.allowedTags })
  } else {
    DOMPurify.setConfig({ ALLOWED_TAGS: defaultAllowedTags })
  }

  // 属性の設定
  if (options?.allowedAttributes) {
    const allowedAttr: string[] = []
    for (const [tag, attrs] of Object.entries(options.allowedAttributes)) {
      attrs.forEach(attr => {
        allowedAttr.push(`${tag}:${attr}`)
      })
    }
    DOMPurify.setConfig({ ALLOWED_ATTR: allowedAttr })
  }

  const cleaned = DOMPurify.sanitize(html)
  
  // デフォルト設定に戻す
  DOMPurify.setConfig({})
  
  return cleaned
}

// 一般的なテキスト入力のサニタイズ
export function sanitizeText(text: string, maxLength?: number): string {
  let sanitized = text
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // 制御文字を除去
    .replace(/\r\n/g, '\n') // 改行を統一

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }

  return sanitized
}

// JSON入力のサニタイズと検証
export function sanitizeJson(jsonString: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(jsonString)
    
    // オブジェクトでない場合は拒否
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    // 再帰的にサニタイズ
    return sanitizeObject(parsed)
  } catch {
    logger.warn('無効なJSON形式', {
      action: 'sanitize_json_invalid'
    })
    return null
  }
}

// オブジェクトの再帰的サニタイズ
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    // キーのサニタイズ
    const sanitizedKey = sanitizeText(key, 100)

    // 値のサニタイズ
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeText(value)
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[sanitizedKey] = value
    } else if (value === null) {
      sanitized[sanitizedKey] = null
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item => 
        typeof item === 'object' && item !== null 
          ? sanitizeObject(item as Record<string, unknown>)
          : item
      )
    } else if (typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeObject(value as Record<string, unknown>)
    }
    // その他の型（関数など）は除外
  }

  return sanitized
}

// 数値入力のサニタイズ
export function sanitizeNumber(input: string | number, options?: {
  min?: number
  max?: number
  decimals?: number
}): number | null {
  const num = typeof input === 'string' ? parseFloat(input) : input

  if (isNaN(num) || !isFinite(num)) {
    return null
  }

  let sanitized = num

  if (options?.min !== undefined && sanitized < options.min) {
    sanitized = options.min
  }

  if (options?.max !== undefined && sanitized > options.max) {
    sanitized = options.max
  }

  if (options?.decimals !== undefined) {
    sanitized = Math.round(sanitized * Math.pow(10, options.decimals)) / Math.pow(10, options.decimals)
  }

  return sanitized
}

// 日付入力のサニタイズ
export function sanitizeDate(dateString: string): Date | null {
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) {
    return null
  }

  // 妥当な範囲内かチェック（例：1900年〜2100年）
  const minDate = new Date('1900-01-01')
  const maxDate = new Date('2100-12-31')
  
  if (date < minDate || date > maxDate) {
    logger.warn('日付が妥当な範囲外', {
      action: 'sanitize_date_out_of_range',
      metadata: { date: dateString }
    })
    return null
  }

  return date
}