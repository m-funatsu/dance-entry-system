// サーバーサイド専用のセッション管理機能
// このファイルはサーバーコンポーネントとAPI Route でのみ使用してください

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

// セッション設定
const SESSION_CONFIG = {
  // セッションタイムアウト（30分）
  IDLE_TIMEOUT: 30 * 60 * 1000,
  // 絶対タイムアウト（24時間）
  ABSOLUTE_TIMEOUT: 24 * 60 * 60 * 1000,
  // セッション更新間隔（5分）
  REFRESH_INTERVAL: 5 * 60 * 1000,
  // 同時セッション数の制限
  MAX_CONCURRENT_SESSIONS: 3,
  // セッションID長
  SESSION_ID_LENGTH: 32
}

// セッション情報の型
interface SessionInfo {
  id: string
  userId: string
  createdAt: Date
  lastActivity: Date
  ipAddress: string
  userAgent: string
  isActive: boolean
}

// セッションIDの生成
export function generateSessionId(): string {
  return crypto.randomBytes(SESSION_CONFIG.SESSION_ID_LENGTH).toString('hex')
}

// セッションの作成
export async function createSession(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<SessionInfo> {
  try {
    const supabase = await createClient()
    const sessionId = generateSessionId()
    const now = new Date()

    // 既存のアクティブセッション数をチェック
    const { data: activeSessions } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)

    // 同時セッション数制限チェック
    if (activeSessions && activeSessions.length >= SESSION_CONFIG.MAX_CONCURRENT_SESSIONS) {
      // 最も古いセッションを無効化
      const { data: oldestSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (oldestSession) {
        await invalidateSession(oldestSession.id)
      }
    }

    // 新しいセッションを作成
    const sessionInfo: SessionInfo = {
      id: sessionId,
      userId,
      createdAt: now,
      lastActivity: now,
      ipAddress,
      userAgent,
      isActive: true
    }

    const { error } = await supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        created_at: now.toISOString(),
        last_activity: now.toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        is_active: true
      })

    if (error) throw error

    // セッションクッキーを設定
    const cookieStore = await cookies()
    cookieStore.set('session-id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(Date.now() + SESSION_CONFIG.ABSOLUTE_TIMEOUT)
    })

    logger.info('新しいセッションを作成しました', {
      action: 'create_session',
      userId,
      metadata: { sessionId, ipAddress }
    })

    return sessionInfo
  } catch (error) {
    logger.error('セッション作成エラー', error, {
      action: 'create_session_error',
      userId
    })
    throw error
  }
}

// セッションの検証
export async function validateSession(sessionId: string): Promise<SessionInfo | null> {
  try {
    const supabase = await createClient()
    const now = new Date()

    const { data: session, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .single()

    if (error || !session) {
      logger.warn('無効なセッションID', {
        action: 'validate_session_invalid',
        metadata: { sessionId }
      })
      return null
    }

    // タイムアウトチェック
    const lastActivity = new Date(session.last_activity)
    const createdAt = new Date(session.created_at)

    // アイドルタイムアウト
    if (now.getTime() - lastActivity.getTime() > SESSION_CONFIG.IDLE_TIMEOUT) {
      await invalidateSession(sessionId)
      logger.warn('セッションがアイドルタイムアウトしました', {
        action: 'session_idle_timeout',
        userId: session.user_id,
        metadata: { sessionId }
      })
      return null
    }

    // 絶対タイムアウト
    if (now.getTime() - createdAt.getTime() > SESSION_CONFIG.ABSOLUTE_TIMEOUT) {
      await invalidateSession(sessionId)
      logger.warn('セッションが絶対タイムアウトしました', {
        action: 'session_absolute_timeout',
        userId: session.user_id,
        metadata: { sessionId }
      })
      return null
    }

    // 最終アクティビティを更新（更新間隔チェック付き）
    if (now.getTime() - lastActivity.getTime() > SESSION_CONFIG.REFRESH_INTERVAL) {
      await supabase
        .from('user_sessions')
        .update({ last_activity: now.toISOString() })
        .eq('id', sessionId)
    }

    return {
      id: session.id,
      userId: session.user_id,
      createdAt: new Date(session.created_at),
      lastActivity: now,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      isActive: true
    }
  } catch (error) {
    logger.error('セッション検証エラー', error, {
      action: 'validate_session_error',
      metadata: { sessionId }
    })
    return null
  }
}

// セッションの無効化
export async function invalidateSession(sessionId: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        invalidated_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) throw error

    logger.info('セッションを無効化しました', {
      action: 'invalidate_session',
      metadata: { sessionId }
    })
  } catch (error) {
    logger.error('セッション無効化エラー', error, {
      action: 'invalidate_session_error',
      metadata: { sessionId }
    })
  }
}

// ユーザーの全セッションを無効化
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        invalidated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error

    logger.info('ユーザーの全セッションを無効化しました', {
      action: 'invalidate_all_user_sessions',
      userId
    })
  } catch (error) {
    logger.error('全セッション無効化エラー', error, {
      action: 'invalidate_all_user_sessions_error',
      userId
    })
  }
}

// アクティブセッションの取得
export async function getActiveSessions(userId: string): Promise<SessionInfo[]> {
  try {
    const supabase = await createClient()

    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_activity', { ascending: false })

    if (error) throw error

    return sessions.map(session => ({
      id: session.id,
      userId: session.user_id,
      createdAt: new Date(session.created_at),
      lastActivity: new Date(session.last_activity),
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      isActive: true
    }))
  } catch (error) {
    logger.error('アクティブセッション取得エラー', error, {
      action: 'get_active_sessions_error',
      userId
    })
    return []
  }
}

// セッションクリーンアップ（定期実行用）
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const supabase = await createClient()
    const now = new Date()

    // アイドルタイムアウトしたセッション
    const idleTimeout = new Date(now.getTime() - SESSION_CONFIG.IDLE_TIMEOUT)
    
    // 絶対タイムアウトしたセッション
    const absoluteTimeout = new Date(now.getTime() - SESSION_CONFIG.ABSOLUTE_TIMEOUT)

    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false,
        invalidated_at: now.toISOString()
      })
      .eq('is_active', true)
      .or(`last_activity.lt.${idleTimeout.toISOString()},created_at.lt.${absoluteTimeout.toISOString()}`)

    if (error) throw error

    logger.info('期限切れセッションをクリーンアップしました', {
      action: 'cleanup_expired_sessions'
    })
  } catch (error) {
    logger.error('セッションクリーンアップエラー', error, {
      action: 'cleanup_expired_sessions_error'
    })
  }
}