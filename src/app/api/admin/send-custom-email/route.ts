import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailTemplateData } from '@/lib/types'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  let to: string | undefined
  let subject: string | undefined
  let templateId: string | undefined
  
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

    const requestData = await request.json()
    to = requestData.to
    subject = requestData.subject
    templateId = requestData.templateId
    const data = requestData.data

    if (!to || !subject || !templateId) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 })
    }

    // メールテンプレートを取得
    const html = await generateEmailTemplate(templateId, data)

    // Supabase Edge Functionを呼び出してメール送信
    const { data: session } = await supabase.auth.getSession()
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-custom-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.session?.access_token}`,
      },
      body: JSON.stringify({
        to,
        subject,
        html,
        from: 'ダンスエントリーシステム <noreply@dance-entry.com>'
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error || 'メール送信に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'メールを送信しました',
      id: result.id 
    })

  } catch (error) {
    logger.error('メール送信エラー', error as Error, {
      action: 'send_custom_email',
      metadata: { to, subject, templateId }
    })
    return NextResponse.json(
      { error: 'メール送信処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

// メールテンプレート生成
async function generateEmailTemplate(templateId: string, data: Partial<EmailTemplateData>): Promise<string> {
  const templates: Record<string, (data: Partial<EmailTemplateData>) => string> = {
    'entry-confirmation': (data) => `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">エントリー確認</h1>
        <p>こんにちは、${data.name}様</p>
        <p>以下の内容でエントリーを受け付けました：</p>
        <ul>
          <li>ダンスジャンル: ${data.danceStyle}</li>
          <li>チーム名: ${data.teamName || '個人参加'}</li>
          <li>エントリーID: ${data.entryId}</li>
        </ul>
        <p>ご不明な点がございましたら、お問い合わせください。</p>
      </div>
    `,
    'selection-result': (data) => `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">選考結果のお知らせ</h1>
        <p>こんにちは、${data.name}様</p>
        <p>選考の結果をお知らせいたします。</p>
        <div style="padding: 20px; background-color: ${data.result === 'selected' ? '#e6f7ff' : '#fff1f0'}; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: ${data.result === 'selected' ? '#1890ff' : '#ff4d4f'};">
            ${data.result === 'selected' ? '選考通過' : '選考結果'}
          </h2>
          <p>${data.message}</p>
        </div>
        <p>今後ともよろしくお願いいたします。</p>
      </div>
    `,
    'deadline-reminder': (data) => `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">提出期限のお知らせ</h1>
        <p>こんにちは、${data.name}様</p>
        <p>以下の提出期限が近づいています：</p>
        <div style="padding: 15px; background-color: #fff7e6; border-left: 4px solid #ffa940; margin: 20px 0;">
          <p><strong>${data.itemName}</strong></p>
          <p>期限: ${data.deadline}</p>
        </div>
        <p>お早めにご提出ください。</p>
      </div>
    `
  }

  const template = templates[templateId]
  if (!template) {
    throw new Error('無効なテンプレートIDです')
  }

  return template(data)
}