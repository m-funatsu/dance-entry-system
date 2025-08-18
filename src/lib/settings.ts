import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

/**
 * 管理者メールアドレスを取得（送信者アドレスとしても使用）
 */
export async function getAdminEmail(): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_email')
      .maybeSingle()

    return setting?.value || null
  } catch (error) {
    logger.error('管理者メールアドレス取得エラー', error, {
      action: 'get_admin_email'
    })
    return null
  }
}

/**
 * 管理者メールアドレスを送信者として使用する関数
 */
export async function getFromEmailAddress(): Promise<string> {
  const adminEmail = await getAdminEmail()
  return adminEmail || 'noreply@example.com' // フォールバック
}

/**
 * 設定値を取得する汎用関数
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()

    return setting?.value || null
  } catch (error) {
    logger.error(`設定値取得エラー: ${key}`, error, {
      action: 'get_setting'
    })
    return null
  }
}

/**
 * 管理者用設定値を取得する関数（管理者権限で取得）
 */
export async function getAdminSetting(key: string): Promise<string | null> {
  try {
    const adminSupabase = createAdminClient()
    
    const { data: setting } = await adminSupabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()

    return setting?.value || null
  } catch (error) {
    logger.error(`管理者設定値取得エラー: ${key}`, error, {
      action: 'get_admin_setting'
    })
    return null
  }
}

/**
 * 新しいエントリーが作成された時に管理者に通知メールを送信
 */
export async function notifyAdminNewEntry(entryData: {
  id: string
  userName: string
  userEmail: string
  danceStyle: string
  participantNames: string
  createdAt: string
}) {
  try {
    const adminEmail = await getAdminEmail()
    
    if (!adminEmail) {
      logger.warn('管理者通知メールアドレスが設定されていないため、通知をスキップします', {
        action: 'notify_admin_new_entry'
      })
      return
    }

    // メール送信のAPIを呼び出し（実装は後で行う）
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/send-entry-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminEmail,
        entryData
      })
    })

    if (!response.ok) {
      throw new Error(`通知メール送信API呼び出し失敗: ${response.status}`)
    }

    logger.info('管理者通知メール送信成功', {
      action: 'notify_admin_new_entry'
    })
  } catch (error) {
    logger.error('管理者通知メール送信エラー', error, {
      action: 'notify_admin_new_entry'
    })
  }
}