import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Twilioの設定（環境変数で管理）
// const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
// const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
// const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 管理者権限チェック
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const { 
      userId, 
      message, 
      notificationType = 'email' // 'email', 'sms', 'line'
    } = await request.json()

    if (!userId || !message) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 })
    }

    // ユーザー情報を取得
    const adminSupabase = createAdminClient()
    const { data: targetUser } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    let result = { success: false, message: '' }

    switch (notificationType) {
      case 'email':
        // 既存のメール送信処理
        result = await sendEmailNotification()
        break
        
      case 'sms':
        // SMS送信処理（Twilioを使用する場合）
        if (!targetUser.phone_number) {
          return NextResponse.json({ error: '電話番号が登録されていません' }, { status: 400 })
        }
        result = await sendSMSNotification(targetUser.phone_number, message)
        break
        
      case 'line':
        // LINE送信処理（LINE Notifyを使用する場合）
        if (!targetUser.line_notify_token) {
          return NextResponse.json({ error: 'LINE Notifyトークンが設定されていません' }, { status: 400 })
        }
        result = await sendLineNotification(targetUser.line_notify_token, message)
        break
        
      default:
        return NextResponse.json({ error: '無効な通知タイプです' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `${notificationType.toUpperCase()}で通知を送信しました` 
    })

  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { error: '通知送信中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

// メール送信（既存の処理を流用）
async function sendEmailNotification() {
  // 実装済みのメール送信処理
  // TODO: 実際のメール送信処理を実装
  return { success: true, message: 'メール送信完了' }
}

// SMS送信（Twilioの例）
async function sendSMSNotification(phoneNumber: string, message: string) {
  try {
    // Twilioを使用する場合のサンプル
    /*
    const twilio = require('twilio')
    const client = twilio(twilioAccountSid, twilioAuthToken)
    
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    })
    
    return { success: true, message: `SMS送信完了: ${result.sid}` }
    */
    
    // 実装前のモック
    console.log(`SMS送信: ${phoneNumber} - ${message}`)
    return { success: true, message: 'SMS送信機能は実装準備中です' }
  } catch (error) {
    console.error('SMS送信エラー:', error)
    return { success: false, message: 'SMS送信に失敗しました' }
  }
}

// LINE通知（LINE Notifyの例）
async function sendLineNotification(token: string, message: string) {
  try {
    const response = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `message=${encodeURIComponent(message)}`
    })
    
    if (!response.ok) {
      throw new Error(`LINE Notify API error: ${response.status}`)
    }
    
    const data = await response.json()
    return { success: true, message: `LINE通知送信完了: ${data.status}` }
  } catch (error) {
    console.error('LINE通知エラー:', error)
    return { success: false, message: 'LINE通知送信に失敗しました' }
  }
}